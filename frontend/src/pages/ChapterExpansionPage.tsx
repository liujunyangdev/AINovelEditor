import React, { useState, useRef, useEffect, useCallback } from 'react'; // Added React hooks
import { Form, Button, Spin, Card, message, Typography, Select, Input, Space, Empty } from 'antd';
import { useParams } from 'react-router-dom';
import { streamExpandStory } from '../services/api';
import { StoryExpandRequest } from '../types';
import { useProjectStore } from '../store/projectStore';

const { Title, Paragraph } = Typography;
const { Option } = Select;
const { TextArea } = Input;

export const ChapterExpansionPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const projectIdNum = projectId ? parseInt(projectId) : undefined;
  const { currentProject, saveExpandedChapterContent, loading: storeLoading } = useProjectStore();

  const [form] = Form.useForm();
  const [loadingExpansion, setLoadingExpansion] = useState(false);
  const [savingContent, setSavingContent] = useState(false);
  const [expandedText, setExpandedText] = useState<string>('');
  const [selectedChapterId, setSelectedChapterId] = useState<number | undefined>(undefined);
  const [currentStyle, setCurrentStyle] = useState<string>('Standard Novel'); // Default style
  const editorRef = useRef<HTMLTextAreaElement>(null); // Ref for auto-scrolling

  const selectedChapter = currentProject?.chapters?.find(chap => chap.id === selectedChapterId);

  // Auto-scroll to bottom of the editor as text streams in
  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.scrollTop = editorRef.current.scrollHeight;
    }
  }, [expandedText]);

  // Load existing content if chapter is selected and has content
  useEffect(() => {
    if (selectedChapter && selectedChapter.content !== undefined && selectedChapter.content !== null) {
      setExpandedText(selectedChapter.content);
    } else {
      setExpandedText('');
    }
    // Set initial style if not already set, or retrieve from chapter data
    if (!currentStyle) {
      setCurrentStyle('Standard Novel');
    }
  }, [selectedChapter, currentStyle]);

  const handleExpandStory = useCallback(async (chapterSummary: string, characters: any[]) => {
    if (!projectIdNum || !currentProject || !selectedChapterId || !selectedChapter) {
      message.error('Please select a chapter and ensure project is loaded.');
      return;
    }

    setLoadingExpansion(true);
    setExpandedText(''); // Clear previous text
    let accumulatedText = '';

    try {
      const request: StoryExpandRequest = {
        chapter_summary: chapterSummary,
        characters: characters.map(char => char.data), // Send only data part
        style: currentStyle,
      };
      const stream = await streamExpandStory(request);

      for await (const chunk of stream) {
        accumulatedText += chunk;
        setExpandedText(accumulatedText);
      }
      message.success('Chapter expansion complete!');
    } catch (error) {
      console.error('Failed to expand story:', error);
      message.error(`Failed to expand story: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setLoadingExpansion(false);
    }
  }, [projectIdNum, currentProject, selectedChapterId, selectedChapter, currentStyle]);

  const handleSaveContent = async () => {
    if (!projectIdNum || !selectedChapterId || !expandedText) {
      message.error('No content to save or chapter not selected.');
      return;
    }
    setSavingContent(true);
    try {
      await saveExpandedChapterContent(selectedChapterId, expandedText);
      message.success('Chapter content saved successfully!');
    } catch (error) {
      console.error('Failed to save chapter content:', error);
      message.error(`Failed to save chapter content: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setSavingContent(false);
    }
  };


  if (!currentProject && storeLoading) {
    return <Spin tip="Loading project..." />;
  }
  if (!currentProject) {
    return <p>No project selected. Please select one from the sidebar.</p>;
  }
  if (!currentProject.chapters || currentProject.chapters.length === 0) {
    return (
      <Card>
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={
            <span>
              No chapters planned for this project.
              <br />
              Please generate and save a Chapter Plan first from the "Chapter Planning" page.
            </span>
          }
        />
      </Card>
    );
  }

  const availableChapters = currentProject.chapters.map(chap => ({
    label: `Chapter ${chap.chapter_index}: ${chap.plan_data.dramatic_goal || chap.plan_data.summary}`,
    value: chap.id,
    summary: chap.plan_data.summary,
  }));

  const availableStyles = [
    'Standard Novel', 'Fantasy Epic', 'Sci-Fi Thriller', 'Detective Noir', 'Young Adult', 'Historical Fiction'
  ];

  return (
    <div>
      <Title level={1}>Chapter Expansion for Project: {currentProject.name}</Title>
      <Paragraph>Select a chapter plan to expand its summary into full text.</Paragraph>

      <Form form={form} layout="vertical">
        <Form.Item label="Select Chapter to Expand" name="selectedChapter" rules={[{ required: true, message: 'Please select a chapter!' }]}>
          <Select
            placeholder="Select a chapter"
            onChange={(value: number) => setSelectedChapterId(value)}
            value={selectedChapterId}
          >
            {availableChapters.map(chap => (
              <Option key={chap.value} value={chap.value}>
                {chap.label}
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item label="Expansion Style" name="expansionStyle">
            <Select
              placeholder="Select writing style"
              onChange={(value: string) => setCurrentStyle(value)}
              value={currentStyle}
            >
              {availableStyles.map(style => (
                <Option key={style} value={style}>{style}</Option>
              ))}
            </Select>
        </Form.Item>

        {selectedChapter && (
          <Card title={`Chapter ${selectedChapter.chapter_index} Summary`} style={{ marginBottom: 20 }}>
            <Paragraph>{selectedChapter.plan_data.summary}</Paragraph>
          </Card>
        )}

        <Space>
            <Button 
                type="primary" 
                onClick={() => selectedChapter && handleExpandStory(selectedChapter.plan_data.summary, currentProject.characters || [])}
                loading={loadingExpansion}
                disabled={!selectedChapter || loadingExpansion}
            >
                {loadingExpansion ? 'Expanding...' : 'Expand Chapter'}
            </Button>
            <Button 
                type="default" 
                onClick={handleSaveContent}
                loading={savingContent}
                disabled={!expandedText || savingContent}
            >
                Save Expanded Content
            </Button>
        </Space>
      </Form>

      <Card title="Expanded Chapter Content" style={{ marginTop: 20 }}>
        <TextArea
          ref={editorRef}
          rows={20}
          value={expandedText}
          onChange={(e) => setExpandedText(e.target.value)}
          placeholder="Expanded story content will appear here..."
          style={{ width: '100%' }}
        />
      </Card>
    </div>
  );
};