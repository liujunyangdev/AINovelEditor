import React, { useEffect } from 'react';
import { Button, Space, Typography, List, Card } from 'antd'; // Added Typography, List, Card
import { Link, useParams } from 'react-router-dom';
import { useProjectStore } from '../store/projectStore';

export const ProjectDetail: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const projectIdNum = projectId ? parseInt(projectId) : undefined;
  const { currentProject, selectProject, loading, error } = useProjectStore();

  useEffect(() => {
    if (projectIdNum && (!currentProject || currentProject.id !== projectIdNum)) {
      selectProject(projectIdNum);
    }
  }, [projectIdNum, currentProject, selectProject]);

  if (loading) return <div>Loading project...</div>;
  if (error) return <div style={{ color: 'red' }}>Error: {error}</div>;
  if (!currentProject) return <div>Project not found or not selected.</div>;

  return (
    <div>
      <Typography.Title level={2}>Project: {currentProject.name}</Typography.Title>
      <Typography.Paragraph>{currentProject.description}</Typography.Paragraph>
      <Typography.Text strong>Project ID: {currentProject.id}</Typography.Text>

      {/* Navigation for AI generation steps */}
      <nav style={{ marginTop: '20px', marginBottom: '20px' }}>
        <Space wrap> {/* Added wrap to Space */}
          <Button type="primary"><Link to={`/project/${projectIdNum}/character`}>Character Generation</Link></Button>
          <Button type="primary"><Link to={`/project/${projectIdNum}/outline`}>Story Outline</Link></Button>
          <Button type="primary"><Link to={`/project/${projectIdNum}/chapters`}>Chapter Planning</Link></Button>
          <Button type="primary"><Link to={`/project/${projectIdNum}/expand`}>Chapter Expansion</Link></Button>
        </Space>
      </nav>

      {/* Display Characters */}
      <Typography.Title level={3} style={{ marginTop: '30px' }}>Characters</Typography.Title>
      {currentProject.characters && currentProject.characters.length > 0 ? (
        <List
          grid={{ gutter: 16, xs: 1, sm: 2, md: 2, lg: 3, xl: 4, xxl: 4 }}
          dataSource={currentProject.characters}
          renderItem={(char) => (
            <List.Item>
              <Card title={char.data.name || "Unnamed Character"}>
                <Typography.Text strong>Age:</Typography.Text> {char.data.age}<br/>
                <Typography.Text strong>Personality:</Typography.Text> {char.data.personality}<br/>
                {/* Add more character details here if needed */}
              </Card>
            </List.Item>
          )}
        />
      ) : (
        <Typography.Paragraph>No characters saved yet. Go to Character Generation to create one!</Typography.Paragraph>
      )}

      {/* Display Story Outline */}
      <Typography.Title level={3} style={{ marginTop: '30px' }}>Story Outline</Typography.Title>
      {currentProject.story_outline ? (
        <Card title={currentProject.story_outline.data.story_theme || "Story Outline"}>
          <Typography.Paragraph><strong>Core Conflict:</strong> {currentProject.story_outline.data.core_conflict}</Typography.Paragraph>
          <Typography.Paragraph><strong>World Setting:</strong> {currentProject.story_outline.data.world_setting}</Typography.Paragraph>
          <Typography.Paragraph><strong>Abstract Outline:</strong> {currentProject.story_outline.data.abstract_outline}</Typography.Paragraph>
          {/* Add more outline details here if needed */}
        </Card>
      ) : (
        <Typography.Paragraph>No story outline saved yet. Generate one from the Story Outline page.</Typography.Paragraph>
      )}

      {/* Display Chapters */}
      <Typography.Title level={3} style={{ marginTop: '30px' }}>Chapters</Typography.Title>
      {currentProject.chapters && currentProject.chapters.length > 0 ? (
        <List
          grid={{ gutter: 16, xs: 1, sm: 2, md: 2, lg: 3, xl: 4, xxl: 4 }}
          dataSource={currentProject.chapters}
          renderItem={(chapter) => (
            <List.Item>
              <Card title={`Chapter ${chapter.chapter_index}: ${chapter.plan_data.dramatic_goal || ''}`}>
                <Typography.Paragraph><strong>Summary:</strong> {chapter.plan_data.summary}</Typography.Paragraph>
                <Typography.Paragraph><strong>Position:</strong> {chapter.plan_data.position}</Typography.Paragraph>
                {/* Add more chapter details here if needed */}
              </Card>
            </List.Item>
          )}
        />
      ) : (
        <Typography.Paragraph>No chapters planned yet. Generate them from the Chapter Planning page.</Typography.Paragraph>
      )}
    </div>
  );
};