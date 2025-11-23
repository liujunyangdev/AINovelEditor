import React, { useEffect, useState } from 'react';
import { Layout, Menu, Button, theme, Modal, Form, Input, message } from 'antd'; // Removed Space
import { PlusOutlined, ProjectOutlined } from '@ant-design/icons';
import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import { useProjectStore } from './store/projectStore';
import { Project } from './types';

// Import page components
import { Home } from './pages/Home';
import { ProjectDetail } from './pages/ProjectDetail'; // Corrected path
import { CharacterGenerationPage } from './pages/CharacterGenerationPage';
import { StoryOutlinePage } from './pages/StoryOutlinePage';
import { ChapterPlanningPage } from './pages/ChapterPlanningPage';
import { ChapterExpansionPage } from './pages/ChapterExpansionPage';

const { Header, Sider, Content } = Layout;

// AppContent remains the same, but uses imported components
const AppContent: React.FC = () => {
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();
  
  // Removed redundant projectId extraction logic

  return (
    <Content
      style={{
        margin: '24px 16px',
        padding: 24,
        minHeight: 280,
        background: colorBgContainer,
        borderRadius: borderRadiusLG,
      }}
    >
      <Routes>
        <Route path="/" element={<Home />} />
        {/* ProjectDetail now handles projectId via useParams internally */}
        <Route path="/project/:projectId" element={<ProjectDetail />} /> 
        <Route path="/project/:projectId/character" element={<CharacterGenerationPage />} />
        <Route path="/project/:projectId/outline" element={<StoryOutlinePage />} />
        <Route path="/project/:projectId/chapters" element={<ChapterPlanningPage />} />
        <Route path="/project/:projectId/expand" element={<ChapterExpansionPage />} />
      </Routes>
    </Content>
  );
};


const App: React.FC = () => {
  const { projects, fetchProjects, createNewProject, loading } = useProjectStore(); // Removed error from destructuring, using message instead
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const showModal = () => {
    setIsModalOpen(true);
  };

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      await createNewProject(values.name, values.description);
      message.success('Project created successfully!');
      setIsModalOpen(false);
      form.resetFields();
      // Navigate to the new project's detail page
      const currentProjectState = useProjectStore.getState().currentProject;
      if (currentProjectState) {
        navigate(`/project/${currentProjectState.id}`);
      }
    } catch (info) {
      console.error('Validate Failed or Project Creation Failed:', info); // Use console.error
      message.error('Failed to create project.');
    }
  };

  const handleCancel = () => {
    setIsModalOpen(false);
    form.resetFields();
  };

  const menuItems = projects.map((project: Project) => ({
    key: String(project.id),
    icon: <ProjectOutlined />,
    label: <Link to={`/project/${project.id}`}>{project.name}</Link>,
  }));

  return (
    <Layout style={{ minHeight: '100vh', width: '100vw'}}>
      <Sider trigger={null} collapsible collapsed={false} width={250}>
        <div className="demo-logo-vertical" style={{ height: 32, margin: 16, background: 'rgba(255, 255, 255, 0.2)', textAlign: 'center', lineHeight: '32px', color: 'white' }}>
          NovelAI Creator
        </div>
        <Menu
          theme="dark"
          mode="inline"
          defaultSelectedKeys={['1']}
          items={menuItems}
        />
        <div style={{ padding: '16px', borderTop: '1px solid #444' }}>
          <Button 
            type="primary" 
            onClick={showModal} 
            block 
            icon={<PlusOutlined />}
            loading={loading && !useProjectStore.getState().currentProject}
          >
            Create New Project
          </Button>
        </div>
      </Sider>
      <Layout>
        <Header style={{ padding: 0, background: 'white' }}>
          {/* Maybe add a project title here */}
        </Header>
        <AppContent /> {/* Central content area */}
      </Layout>

      <Modal
        title="Create New Project"
        open={isModalOpen}
        onOk={handleOk}
        onCancel={handleCancel}
        confirmLoading={loading && !!useProjectStore.getState().currentProject}
      >
        <Form
          form={form}
          layout="vertical"
          name="form_in_modal"
          initialValues={{ modifier: 'public' }}
        >
          <Form.Item
            name="name"
            label="Project Name"
            rules={[{ required: true, message: 'Please input the name of the project!' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item name="description" label="Description">
            <Input.TextArea />
          </Form.Item>
        </Form>
      </Modal>
    </Layout>
  );
};

export default App;
