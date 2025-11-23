import React, { useState } from 'react';
import { Form, Input, Button, Card, message } from 'antd'; // Removed Spin
import { useParams } from 'react-router-dom';
import { generateCharacter } from '../services/api';
import { CharacterGenerateRequest, CharacterGenerateResponse, CharacterCreate } from '../types'; // Added CharacterCreate
import { useProjectStore } from '../store/projectStore';

const { TextArea } = Input;

export const CharacterGenerationPage: React.FC = () => { // Changed to named export
  const { projectId } = useParams<{ projectId: string }>();
  const projectIdNum = projectId ? parseInt(projectId) : undefined;
  const { currentProject, saveCharacterToProject } = useProjectStore(); // Added saveCharacterToProject action from store

  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false); // New state for saving status
  const [generatedCharacter, setGeneratedCharacter] = useState<CharacterGenerateResponse | null>(null);

  // Check if the generated character is already saved to the current project
  const isCharacterSaved = generatedCharacter && currentProject?.characters?.some(
    (char) => JSON.stringify(char.data) === JSON.stringify(generatedCharacter) // Simple deep comparison for demo
  );


  const onFinish = async (values: { theme: string; prompt_question: string }) => {
    if (!projectIdNum) {
      message.error('Please select or create a project first.');
      return;
    }

    setLoading(true);
    setGeneratedCharacter(null); // Clear previous result

    try {
      const request: CharacterGenerateRequest = {
        theme: values.theme,
        prompt_question: values.prompt_question,
        options: {}, // projectId context passed via path, not needed here directly
      };
      const response = await generateCharacter(request);
      setGeneratedCharacter(response);
      message.success('Character generated successfully!');
    } catch (error) {
      console.error('Failed to generate character:', error);
      message.error(`Failed to generate character: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveCharacter = async () => {
    if (!projectIdNum || !generatedCharacter) {
      message.error('No character generated or project not selected.');
      return;
    }
    setSaving(true);
    try {
      const characterData: CharacterCreate = {
        data: generatedCharacter, // The AI response is the data to be saved
      };
      await saveCharacterToProject(projectIdNum, characterData);
      message.success('Character saved to project successfully!');
    } catch (error) {
      console.error('Failed to save character:', error);
      message.error(`Failed to save character: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <h1>Character Generation for Project: {currentProject?.name || 'Loading...'}</h1>
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        initialValues={{ theme: currentProject?.name ? `Fantasy Novel: ${currentProject.name}` : '', prompt_question: '' }}
      >
        <Form.Item
          name="theme"
          label="Theme/Setting"
          rules={[{ required: true, message: 'Please input the theme or setting!' }]}
        >
          <Input placeholder="e.g., A cyberpunk city in 2077, a medieval fantasy kingdom" />
        </Form.Item>
        <Form.Item
          name="prompt_question"
          label="Character Description Prompt"
          rules={[{ required: true, message: 'Please input the character description prompt!' }]}
        >
          <TextArea
            rows={4}
            placeholder="e.g., A stoic detective with a cybernetic arm, a mischievous elven rogue"
          />
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit" loading={loading}>
            Generate Character
          </Button>
        </Form.Item>
      </Form>

      {generatedCharacter && (
        <Card
          title={generatedCharacter.name || "Generated Character"}
          style={{ marginTop: 20 }}
        >
          <p><strong>Age:</strong> {generatedCharacter.age}</p>
          <p><strong>Personality:</strong> {generatedCharacter.personality}</p>
          <p><strong>Family Background:</strong> {generatedCharacter.family_background}</p>
          <p><strong>Social Class:</strong> {generatedCharacter.social_class}</p>
          <p><strong>Growth Experiences:</strong> {generatedCharacter.growth_experiences}</p>
          <p><strong>Education & Culture:</strong> {generatedCharacter.education_and_culture}</p>
          <p><strong>Profession & Skills:</strong> {generatedCharacter.profession_and_skills}</p>
          <p><strong>Inner Conflict:</strong> {generatedCharacter.inner_conflict}</p>
          <Button 
            type="primary" 
            style={{ marginTop: 10 }}
            onClick={handleSaveCharacter}
            loading={saving}
            disabled={!!isCharacterSaved} // Cast to boolean
          >
            {isCharacterSaved ? 'Saved to Project' : 'Save Character to Project'}
          </Button>
        </Card>
      )}
    </div>
  );
};
