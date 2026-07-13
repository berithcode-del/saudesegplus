import Landing3DHome from '../components/landing3d/Landing3DHome';
import { getLandingTemplate } from '../components/landing3d/getLandingTemplate';

export default function Home() {
  const template = getLandingTemplate();

  return <Landing3DHome markup={template.markup} styles={template.styles} />;
}
