import React from 'react';
import { QuestionEditor } from '../question-editor';

export default function NewQuestionPage(): React.ReactElement {
  return <QuestionEditor mode="create" />;
}
