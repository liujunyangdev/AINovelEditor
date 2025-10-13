import os
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_community.vectorstores import FAISS
from langchain_community.llms import Ollama
from langchain_core.documents import Document

class RAGService:
    def __init__(self):
        # 1. Initialize components
        # For local embedding model, you might need to download it first or ensure Ollama is running with an embedding model
        self.embedding_model = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")
        # For local LLM, ensure Ollama is running and you have downloaded the model (e.g., ollama run llama2)
        self.llm = Ollama(model="llama2") # Assuming 'llama2' model is available via Ollama
        self.text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
        
        self.vector_store = None
        print("RAGService initialized with real models (Ollama, HuggingFaceEmbeddings).")

    def index_directory(self, dir_path: str) -> dict:
        """
        Indexes all .txt files in a given directory.
        Returns a dict with 'success' and 'message'.
        """
        print(f"Starting to index directory: {dir_path}")
        raw_documents = []
        
        if not os.path.isdir(dir_path):
            self.vector_store = None
            return {"success": False, "message": f"错误：目录未找到或无法访问：{dir_path}"}

        for root, _, files in os.walk(dir_path):
            for file in files:
                if file.endswith(".txt"):
                    file_path = os.path.join(root, file)
                    try:
                        with open(file_path, 'r', encoding='utf-8') as f:
                            raw_documents.append(Document(page_content=f.read(), metadata={"source": file_path}))
                    except Exception as e:
                        print(f"Error reading file {file_path}: {e}")
        
        if not raw_documents:
            self.vector_store = None # Reset vector store if no documents found
            print("No .txt files found to index.")
            return {"success": False, "message": f"在 '{dir_path}' 中未找到任何 .txt 文件进行索引。"}

        # 2. Split documents into chunks
        chunks = self.text_splitter.split_documents(raw_documents)
        print(f"Split documents into {len(chunks)} chunks.")

        # 3. Create vector store from chunks
        try:
            self.vector_store = FAISS.from_documents(chunks, self.embedding_model)
            print("Vector store created successfully.")
            return {"success": True, "message": f"成功索引了 {len(chunks)} 个文档块。"}
        except Exception as e:
            self.vector_store = None
            print(f"Error creating vector store: {e}")
            return {"success": False, "message": f"创建向量存储失败：{e}"}

    def generate(self, query: str) -> str:
        """
        Generates a response based on the query and the indexed documents.
        """
        print(f"Generating response for query: {query}")
        if not self.vector_store:
            return "错误：知识库未建立索引。请先选择一个文件夹并建立索引。"

        # 4. Retrieve relevant documents from vector store
        try:
            relevant_docs = self.vector_store.similarity_search(query, k=4) # Retrieve top 4 relevant documents
            context = "\n\n".join([doc.page_content for doc in relevant_docs])
        except Exception as e:
            print(f"Error retrieving documents: {e}")
            return f"错误：检索相关文档失败：{e}"

        # 5. Generate response using LLM
        prompt = f"""
        请根据以下提供的上下文信息，回答用户的问题。如果上下文没有提供足够的信息，请说明你不知道，不要编造信息。

        上下文:
        {context}

        用户问题:
        {query}
        """
        
        try:
            response = self.llm.invoke(prompt)
            return response
        except Exception as e:
            print(f"Error invoking LLM: {e}")
            return f"错误：调用大型语言模型失败：{e}"

# Singleton instance
rag_service = RAGService()