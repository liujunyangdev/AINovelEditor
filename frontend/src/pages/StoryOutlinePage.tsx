import React, { useState } from 'react';
import { Form, Input, Button, Spin, Card, message, Checkbox, Typography, List } from 'antd';
import { useParams } from 'react-router-dom';
import { generateStoryOutline } from '../services/api';
import { StoryOutlineRequest, StoryOutlineResponse, StoryOutlineCreate } from '../types'; // Removed Project
import { useProjectStore } from '../store/projectStore';

// const { TextArea } = Input; // Removed TextArea as it's not used
const { Title, Paragraph } = Typography; // Removed Text

export const StoryOutlinePage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const projectIdNum = projectId ? parseInt(projectId) : undefined;
  const { currentProject, saveStoryOutlineToProject, loading: storeLoading } = useProjectStore(); // Get current project and action from store

  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [generatedOutline, setGeneratedOutline] = useState<StoryOutlineResponse | null>(null);
  const [selectedCharacterIds, setSelectedCharacterIds] = useState<number[]>([]);

  // Derived state to check if outline is already saved
  const isOutlineSaved = generatedOutline && currentProject?.story_outline &&
    JSON.stringify(currentProject.story_outline.data) === JSON.stringify(generatedOutline);

  // Set initial form values based on current project
  React.useEffect(() => {
    if (currentProject) {
      form.setFieldsValue({
        theme: `Main theme of ${currentProject.name}`,
        style: 'Epic fantasy, dramatic, character-driven',
      });
      // Pre-select all characters by default if they exist
      if (currentProject.characters && currentProject.characters.length > 0) {
        setSelectedCharacterIds(currentProject.characters.map(char => char.id));
      }
      // If an outline already exists in the project, display it
      if (currentProject.story_outline) {
        setGeneratedOutline(currentProject.story_outline.data as StoryOutlineResponse);
      }
    }
  }, [currentProject, form]);

  const onFinish = async (values: { theme: string; style: string }) => {
    if (!projectIdNum || !currentProject) {
      message.error('Please select or create a project first.');
      return;
    }
    if (!currentProject.characters || currentProject.characters.length === 0) {
      message.warning('No characters in this project. Generate and save some characters first.'); // Changed to warning
      return;
    }
    if (selectedCharacterIds.length === 0) {
      message.warning('Please select at least one character to generate the outline.'); // Changed to warning
      return;
    }

    setLoading(true);
    setGeneratedOutline(null);

    try {
      // Filter characters based on selectedCharacterIds
      const charactersForRequest = currentProject.characters
        .filter(char => selectedCharacterIds.includes(char.id))
        .map(char => char.data); // Send only the 'data' part of the character

      const request: StoryOutlineRequest = {
        theme: values.theme,
        style: values.style,
        characters: charactersForRequest,
      };
      const response = await generateStoryOutline(request);
      setGeneratedOutline(response);
      message.success('Story outline generated successfully!');
    } catch (error) {
      console.error('Failed to generate story outline:', error);
      message.error(`Failed to generate story outline: ${error instanceof Error ? error.message : String(error)}`);
    }
    finally {
      setLoading(false);
    }
  };

  const handleSaveOutline = async () => {
    if (!projectIdNum || !generatedOutline) {
      message.error('No outline generated or project not selected.');
      return;
    }
    setSaving(true);
    try {
      const outlineData: StoryOutlineCreate = {
        data: generatedOutline,
      };
      // Call the store action to save the outline
      await saveStoryOutlineToProject(projectIdNum, outlineData);
      message.success('Story outline saved to project successfully!');
    } catch (error) {
      console.error('Failed to save story outline:', error);
      message.error(`Failed to save story outline: ${error instanceof Error ? error.message : String(error)}`);
    }
    finally {
      setSaving(false);
    }
  };

  if (!currentProject && storeLoading) {
    return <Spin tip="Loading project..." />;
  }
  if (!currentProject) {
    return <p>No project selected. Please select one from the sidebar.</p>;
  }

  return (
    <div>
      <Title level={1}>Story Outline Generation for Project: {currentProject.name}</Title>
      
      <Card title="Select Characters for Outline" style={{ marginBottom: 20 }}>
        {currentProject.characters && currentProject.characters.length > 0 ? (
          <Checkbox.Group
            options={currentProject.characters.map(char => ({ label: char.data.name, value: char.id }))}
            value={selectedCharacterIds}
            onChange={(checkedValues) => setSelectedCharacterIds(checkedValues as number[])}
            style={{ width: '100%' }}
            // layout="vertical" // Not directly supported by Checkbox.Group, need custom styling for vertical layout
          />
        ) : (
          <Paragraph>No characters in this project. Please generate and save some characters first.</Paragraph>
        )}
      </Card>

      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
      >
        <Form.Item
          name="theme"
          label="Overall Story Theme"
          rules={[{ required: true, message: 'Please input the story theme!' }]}
        >
          <Input placeholder="e.g., A quest for a lost artifact, a struggle for freedom" />
        </Form.Item>
        <Form.Item
          name="style"
          label="Writing Style/Tone"
          rules={[{ required: true, message: 'Please input the desired writing style!' }]}
        >
          <Input placeholder="e.g., Dark fantasy, humorous sci-fi, gritty realism" />
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit" loading={loading} disabled={selectedCharacterIds.length === 0}>
            Generate Story Outline
          </Button>
        </Form.Item>
      </Form>

      {generatedOutline && (
        <Card
          title={generatedOutline.story_theme || "Generated Story Outline"}
          style={{ marginTop: 20 }}
          loading={loading}
        >
          <Title level={4}>Core Conflict:</Title> <Paragraph>{generatedOutline.core_conflict}</Paragraph>
          <Title level={4}>Character Relationships:</Title> <Paragraph>{generatedOutline.character_relationships}</Paragraph>
          <Title level={4}>World Setting:</Title> <Paragraph>{generatedOutline.world_setting}</Paragraph>
          <Title level={4}>Plot Structure:</Title>
          <List
            size="small"
            dataSource={generatedOutline.plot_structure}
            renderItem={(item) => <List.Item>{item}</List.Item>}
          />
          <Title level={4}>Abstract Outline:</Title> <Paragraph>{generatedOutline.abstract_outline}</Paragraph>

          <Button 
            type="primary" 
            style={{ marginTop: 10 }}
            onClick={handleSaveOutline}
            loading={saving}
            disabled={!!isOutlineSaved} // Cast to boolean
          >
            {isOutlineSaved ? 'Outline Saved' : 'Save Story Outline to Project'}
          </Button>
        </Card>
      )}
    </div>
  );
};
