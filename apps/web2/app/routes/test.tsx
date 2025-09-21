import type { Route } from './+types/test';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

export function meta({}: Route.MetaArgs) {
  return [{ title: 'New React Router App' }, { name: 'description', content: 'Welcome to React Router!' }];
}

export default function Home() {
  const [count, setCount] = useState(0);

  return (
    <div>
      Test {count}
      <Button variant="default" onClick={() => setCount(count + 1)}>
        Increment
      </Button>
    </div>
  );
}
