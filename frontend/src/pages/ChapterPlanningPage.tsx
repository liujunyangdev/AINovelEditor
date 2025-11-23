import React, { useState } from 'react';
import { Form, InputNumber, Button, Spin, Card, message, Typography, List, Empty } from 'antd';
import { useParams } from 'react-router-dom';
import { generateChapterPlan } from '../services/api';
import { ChapterPlanRequest, ChapterPlanResponse, ChapterCreate } from '../types';
import { useProjectStore } from '../store/projectStore';

const { Title, Paragraph } = Typography;

export const ChapterPlanningPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const projectIdNum = projectId ? parseInt(projectId) : undefined;
  const { currentProject, saveChapterPlanToProject, loading: storeLoading } = useProjectStore();

  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [generatedChapterPlan, setGeneratedChapterPlan] = useState<ChapterPlanResponse | null>(null);

  // Derived state to check if chapter plan is already saved
  const isChapterPlanSaved = generatedChapterPlan && currentProject?.chapters &&
    (currentProject.chapters.length || 0) > 0 && // Safe access
    generatedChapterPlan.chapters.every(genChap =>
      currentProject!.chapters!.some(savedChap => // Use non-null assertion as we've checked currentProject?.chapters already
        savedChap.chapter_index === genChap.index &&
        JSON.stringify(savedChap.plan_data) === JSON.stringify(genChap)
      )
    );

  React.useEffect(() => {
    if (currentProject?.chapters && currentProject.chapters.length > 0) {
      // If chapters exist in the project, try to load them into the generated plan view
      // This is a simplification; ideally, we'd reconstruct ChapterPlanResponse from saved Chapters
      // For now, just set a default chapter count
      form.setFieldsValue({
        chapter_count: currentProject.chapters.length,
      });
      // Optionally populate generatedChapterPlan from currentProject.chapters
    }
    if (currentProject?.story_outline) {
      // Set a default chapter count based on some heuristic or just 5
      form.setFieldsValue({ chapter_count: 5 });
    }
  }, [currentProject, form]);

  const onFinish = async (values: { chapter_count: number }) => {
    if (!projectIdNum || !currentProject) {
      message.error('Please select or create a project first.');
      return;
    }
    if (!currentProject.story_outline) {
      message.warning('Please generate and save a story outline first.'); // Changed to warning
      return;
    }

    setLoading(true);
    setGeneratedChapterPlan(null);

    try {
      const request: ChapterPlanRequest = {
        outline: currentProject.story_outline.data, // Use the saved story outline
        chapter_count: values.chapter_count,
      };
      const response = await generateChapterPlan(request);
      setGeneratedChapterPlan(response);
      message.success('Chapter plan generated successfully!');
    } catch (error) {
      console.error('Failed to generate chapter plan:', error);
      message.error(`Failed to generate chapter plan: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveChapterPlan = async () => {
    if (!projectIdNum || !generatedChapterPlan) {
      message.error('No chapter plan generated or project not selected.');
      return;
    }
    setSaving(true);
    try {
      // Backend expects ChapterCreate[] for each chapter.
      const chapterCreates: ChapterCreate[] = generatedChapterPlan.chapters.map(chap => ({
        chapter_index: chap.index,
        plan_data: { // Ensure plan_data matches the expected structure in ChapterBase
            position: chap.position,
            dramatic_goal: chap.dramatic_goal,
            inner_conflict_display: chap.inner_conflict_display,
            summary: chap.summary
        },
        content: null, // Initial content is null
      }));

      await saveChapterPlanToProject(projectIdNum, chapterCreates);
      message.success('Chapter plan saved to project successfully!');
    } catch (error) {
      console.error('Failed to save chapter plan:', error);
      message.error(`Failed to save chapter plan: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setSaving(false);
    }
  };

  if (!currentProject && storeLoading) {
    return <Spin tip="Loading project..." />;
  }
  if (!currentProject) {
    return <p>No project selected. Please select one from the sidebar.</p>;
  }
  if (!currentProject.story_outline) {
    return (
      <Card>
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={
            <span>
              No Story Outline found for this project.
              <br />
              Please generate and save a Story Outline first from the "Story Outline" page.
            </span>
          }
        />
      </Card>
    );
  }

  return (
    <div>
      <Title level={1}>Chapter Planning for Project: {currentProject.name}</Title>
      <Paragraph>Based on your story outline: "{currentProject.story_outline.data.story_theme}"</Paragraph>

      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        initialValues={{ chapter_count: currentProject.chapters?.length || 5 }}
      >
        <Form.Item
          name="chapter_count"
          label="Number of Chapters"
          rules={[{ required: true, message: 'Please input the number of chapters!' }]}
        >
          <InputNumber min={1} max={50} />
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit" loading={loading}>
            Generate Chapter Plan
          </Button>
        </Form.Item>
      </Form>

      {generatedChapterPlan && (
        <Card
          title="Generated Chapter Plan"
          style={{ marginTop: 20 }}
          loading={loading}
        >
          <List
            itemLayout="vertical"
            size="large"
            dataSource={generatedChapterPlan.chapters}
            renderItem={item => (
              <List.Item key={item.index}>
                <Card title={`Chapter ${item.index}: ${item.dramatic_goal}`} type="inner">
                  <Paragraph><strong>Position:</strong> {item.position}</Paragraph>
                  <Paragraph><strong>Inner Conflict:</strong> {item.inner_conflict_display}</Paragraph>
                  <Paragraph><strong>Summary:</strong> {item.summary}</Paragraph>
                </Card>
              </List.Item>
            )}
          />

          <Button 
            type="primary" 
            style={{ marginTop: 20 }}
            onClick={handleSaveChapterPlan}
            loading={saving}
            disabled={!!isChapterPlanSaved} // Cast to boolean
          >
            {isChapterPlanSaved ? 'Chapter Plan Saved' : 'Save Chapter Plan to Project'}
          </Button>
        </Card>
      )}
    </div>
  );
};