import React from 'react';
import { ReactFlowProvider } from '@xyflow/react';
import { Neo4jSchemaGraph } from './Neo4jSchemaGraph';

export const Neo4jSchemaGraphWrapper: React.FC = () => {
  return (
    <ReactFlowProvider>
      <Neo4jSchemaGraph />
    </ReactFlowProvider>
  );
};