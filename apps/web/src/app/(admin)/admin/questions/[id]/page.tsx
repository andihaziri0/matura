import React from 'react';
import { QuestionEditor } from '../question-editor';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditQuestionPage({ params }: Props): Promise<React.ReactElement> {
  const { id } = await params;
  return <QuestionEditor mode="edit" id={id} />;
}
