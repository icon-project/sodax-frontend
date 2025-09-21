import type { Route } from './+types/home/page';

export function meta({}: Route.MetaArgs) {
  return [{ title: 'New React Router App' }, { name: 'description', content: 'Welcome to React Router!' }];
}

const LandingPage = () => {
  return <div>Home</div>;
};

export default LandingPage;
