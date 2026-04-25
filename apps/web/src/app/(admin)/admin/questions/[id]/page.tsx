import { QuestionEditor } from '../question-editor';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditQuestionPage({ params }: Props): Promise<JSX.Element> {
  const { id } = await params;
  return <QuestionEditor mode="edit" id={id} />;
}
