import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Card,
  TextArea,
  Button,
  Heading,
  Text,
  Badge,
  Table,
  Flex,
  Code,
  Separator,
  ScrollArea,
  Callout,
  Tabs
} from '@radix-ui/themes';
import {
  PaperPlaneIcon,
  CodeIcon,
  MagicWandIcon,
  QuestionMarkCircledIcon,
  InfoCircledIcon,
  ClockIcon,
  BarChartIcon,
  Share2Icon,
  MagnifyingGlassIcon,
  UpdateIcon
} from '@radix-ui/react-icons';
import * as Accordion from '@radix-ui/react-accordion';
import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { QueryRequest, QueryResponse } from '@/models/types';
import { DatabaseGraphVisualization } from './DatabaseGraphVisualization';
import { QueryResultCharts } from './QueryResultCharts';
import { Neo4jSchemaGraphWrapper } from './Neo4jSchemaGraphWrapper';
import { TableRelevanceVisualization } from './TableRelevanceVisualization';

interface ConversationItem {
  id: string;
  query: string;
  response: QueryResponse | null;
  timestamp: Date;
  type: 'user' | 'followup';
  isLoading?: boolean;
}

const QueryInterface: React.FC = () => {
  const [query, setQuery] = useState('');
  const [conversation, setConversation] = useState<ConversationItem[]>([]);
  const [elapsedTime, setElapsedTime] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const queryMutation = useMutation({
    mutationFn: async (request: QueryRequest & { conversationId?: string }) => {
      const { conversationId, ...queryRequest } = request;
      const response = await axios.post('http://localhost:3000/api/query', queryRequest);
      return { ...response.data, conversationId };
    },
    onSuccess: (data) => {
      // Update the conversation item with the response
      setConversation(prev => 
        prev.map(item => 
          item.id === data.conversationId 
            ? { ...item, response: data, isLoading: false }
            : item
        )
      );
    },
    onError: (error, variables) => {
      // Mark the conversation item as failed
      setConversation(prev => 
        prev.map(item => 
          item.id === variables.conversationId 
            ? { ...item, response: null, isLoading: false }
            : item
        )
      );
    }
  });

  // Timer effect - now after queryMutation is defined
  useEffect(() => {
    if (queryMutation.isPending) {
      setElapsedTime(0);
      const startTime = Date.now();
      
      timerRef.current = setInterval(() => {
        setElapsedTime((Date.now() - startTime) / 1000);
      }, 100);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [queryMutation.isPending]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      const conversationId = `conv-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // Add the question to conversation immediately
      const newItem: ConversationItem = {
        id: conversationId,
        query: query.trim(),
        response: null,
        timestamp: new Date(),
        type: 'user',
        isLoading: true
      };
      
      setConversation(prev => [...prev, newItem]);
      setQuery(''); // Clear the input immediately
      
      // Submit the query
      queryMutation.mutate({ 
        query: query.trim(), 
        followUp: conversation.length > 0,
        conversationId 
      });
    }
  };

  const handleFollowUpQuestion = (question: string) => {
    const conversationId = `conv-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Add the follow-up question to conversation immediately
    const newItem: ConversationItem = {
      id: conversationId,
      query: question,
      response: null,
      timestamp: new Date(),
      type: 'followup',
      isLoading: true
    };
    
    setConversation(prev => [...prev, newItem]);
    
    // Submit the follow-up query
    queryMutation.mutate({ 
      query: question, 
      followUp: true,
      conversationId 
    });
  };

  const handleClarification = (suggestion: string) => {
    setQuery(prev => `${prev} ${suggestion}`);
  };

  const renderTableData = (data: any[]) => {
    if (!data || data.length === 0) return null;

    const columns = Object.keys(data[0]);

    return (
      <ScrollArea style={{ maxHeight: 400 }}>
        <Table.Root size="1">
          <Table.Header>
            <Table.Row>
              {columns.map((col) => (
                <Table.ColumnHeaderCell key={col}>
                  {col}
                </Table.ColumnHeaderCell>
              ))}
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {data.map((row, idx) => (
              <Table.Row key={idx}>
                {columns.map((col) => (
                  <Table.Cell key={col}>
                    {typeof row[col] === 'number' && !Number.isInteger(row[col])
                      ? row[col].toFixed(2)
                      : row[col]?.toString() || '-'}
                  </Table.Cell>
                ))}
              </Table.Row>
            ))}
          </Table.Body>
        </Table.Root>
      </ScrollArea>
    );
  };

  // Component to render individual conversation responses
  const ConversationResponse: React.FC<{ response: QueryResponse; onFollowUp: (question: string) => void }> = ({ response, onFollowUp }) => {
    if (response.clarificationNeeded) {
      return (
        <Box p="3" style={{
          backgroundColor: 'var(--amber-2)',
          border: '1px solid var(--amber-6)',
          borderRadius: 'var(--radius-2)'
        }}>
          <Flex align="center" gap="2" mb="2">
            <QuestionMarkCircledIcon color="var(--amber-9)" />
            <Text weight="bold" color="amber">Need clarification</Text>
          </Flex>
          <Text mb="3">{response.clarificationNeeded.ambiguity}</Text>
          <Flex gap="2" wrap="wrap">
            {response.clarificationNeeded.suggestions.map((suggestion) => (
              <Badge
                key={suggestion}
                variant="soft"
                color="amber"
                style={{ cursor: 'pointer' }}
                onClick={() => handleClarification(suggestion)}
              >
                {suggestion}
              </Badge>
            ))}
          </Flex>
        </Box>
      );
    }

    return (
      <Box style={{
        backgroundColor: 'var(--gray-2)',
        border: '1px solid var(--gray-6)',
        borderRadius: 'var(--radius-2)'
      }}>
        <Accordion.Root type="multiple" defaultValue={['sql', 'results']}>
          {/* SQL Query */}
          <Accordion.Item value="sql">
            <Accordion.Header>
              <Accordion.Trigger style={{ 
                width: '100%', 
                padding: 'var(--space-3)', 
                backgroundColor: 'var(--gray-3)',
                border: 'none',
                borderRadius: 'var(--radius-2)',
                cursor: 'pointer',
                marginBottom: 'var(--space-2)'
              }}>
                <Flex align="center" gap="2">
                  <CodeIcon />
                  <Text>Generated SQL</Text>
                </Flex>
              </Accordion.Trigger>
            </Accordion.Header>
            <Accordion.Content>
              <Box p="3" style={{ 
                backgroundColor: 'var(--gray-4)', 
                borderRadius: 'var(--radius-2)',
                fontFamily: 'monospace'
              }}>
                <pre style={{ margin: 0, color: 'var(--green-11)', fontSize: '12px' }}>
                  {response.sql}
                </pre>
              </Box>
              {response.explanation && (
                <Box mt="2" p="2" style={{ 
                  backgroundColor: 'var(--blue-2)', 
                  borderRadius: 'var(--radius-2)',
                  border: '1px solid var(--blue-6)'
                }}>
                  <Text size="2" color="blue">{response.explanation}</Text>
                </Box>
              )}
            </Accordion.Content>
          </Accordion.Item>

          {/* Results */}
          <Accordion.Item value="results">
            <Accordion.Header>
              <Accordion.Trigger style={{ 
                width: '100%', 
                padding: 'var(--space-3)', 
                backgroundColor: 'var(--gray-3)',
                border: 'none',
                borderRadius: 'var(--radius-2)',
                cursor: 'pointer',
                marginBottom: 'var(--space-2)'
              }}>
                <Text>Results ({response.results.length} rows)</Text>
              </Accordion.Trigger>
            </Accordion.Header>
            <Accordion.Content>
              <Box p="3">
                {renderTableData(response.results)}
              </Box>
            </Accordion.Content>
          </Accordion.Item>

          {/* Insights */}
          {response.insights && response.insights.length > 0 && (
            <Accordion.Item value="insights">
              <Accordion.Header>
                <Accordion.Trigger style={{ 
                  width: '100%', 
                  padding: 'var(--space-3)', 
                  backgroundColor: 'var(--gray-3)',
                  border: 'none',
                  borderRadius: 'var(--radius-2)',
                  cursor: 'pointer',
                  marginBottom: 'var(--space-2)'
                }}>
                  <Flex align="center" gap="2">
                    <MagicWandIcon />
                    <Text>Insights & Analysis</Text>
                  </Flex>
                </Accordion.Trigger>
              </Accordion.Header>
              <Accordion.Content>
                <Box p="3">
                  {response.insights.map((insight, idx) => (
                    <Box key={idx} mb={idx < response.insights.length - 1 ? "2" : "0"}>
                      <Text size="2">{insight}</Text>
                      {idx < response.insights.length - 1 && <Separator size="2" my="2" />}
                    </Box>
                  ))}
                  
                  {/* Add charts for visual insights */}
                  {response.results && response.results.length > 0 && (
                    <Box mt="3">
                      <QueryResultCharts data={response.results} queryType="" />
                    </Box>
                  )}
                </Box>
              </Accordion.Content>
            </Accordion.Item>
          )}
        </Accordion.Root>

        {/* Follow-up Questions */}
        {response.followUpQuestions && response.followUpQuestions.length > 0 && (
          <Box p="3" style={{ borderTop: '1px solid var(--gray-6)' }}>
            <Text size="2" weight="medium" mb="2" color="violet">
              💡 Related questions you might ask:
            </Text>
            <Flex gap="2" wrap="wrap">
              {response.followUpQuestions.map((question, idx) => (
                <Badge
                  key={idx}
                  variant="soft"
                  color="violet"
                  style={{ 
                    cursor: 'pointer',
                    padding: '6px 12px',
                    transition: 'all 0.2s'
                  }}
                  onClick={() => onFollowUp(question)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--violet-4)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--violet-3)';
                  }}
                >
                  {question}
                </Badge>
              ))}
            </Flex>
          </Box>
        )}
      </Box>
    );
  };

  return (
    <Box>
      <Tabs.Root defaultValue="query">
        <Tabs.List mb="4">
          <Tabs.Trigger value="query">Query Interface</Tabs.Trigger>
          <Tabs.Trigger value="schema">
            <Share2Icon width="16" height="16" style={{ marginRight: '4px' }} />
            Database Schema
          </Tabs.Trigger>
          <Tabs.Trigger value="neo4j">
            <Share2Icon width="16" height="16" style={{ marginRight: '4px' }} />
            Graph Schema (Neo4j)
          </Tabs.Trigger>
          <Tabs.Trigger value="relevance">
            <MagnifyingGlassIcon width="16" height="16" style={{ marginRight: '4px' }} />
            Table Relevance
          </Tabs.Trigger>
        </Tabs.List>
        
        <Tabs.Content value="query">
      <Card>
        <Box mb="4" style={{ textAlign: 'center' }}>
          <Heading size="5" mb="2">Natural Language Query Interface</Heading>
          <Text size="3" color="gray" style={{ lineHeight: 1.5 }}>
            Ask questions about your trading data in plain English. For example: "Show me top traders by PnL today"
          </Text>
        </Box>
        
        <form onSubmit={handleSubmit}>
          <Flex gap="3" mb="4">
            <Box style={{ flex: 1 }}>
              <TextArea
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ask about trading data... e.g., 'Show me the top 5 traders by PnL today'"
                disabled={queryMutation.isPending}
                size="3"
                style={{ minHeight: 80 }}
              />
            </Box>
            <Box>
              <Button
                type="submit"
                disabled={!query.trim() || queryMutation.isPending}
                size="3"
                style={{ minWidth: 120 }}
              >
                <PaperPlaneIcon />
                {queryMutation.isPending ? 'Processing...' : 'Query'}
              </Button>
              {queryMutation.isPending && (
                <Flex align="center" gap="1" mt="2" justify="center">
                  <ClockIcon width="14" height="14" />
                  <Text size="2" color="gray">
                    {elapsedTime.toFixed(1)}s
                  </Text>
                </Flex>
              )}
            </Box>
          </Flex>
        </form>

        {/* Example queries */}
        <Box mb="4">
          <Text size="2" color="gray" mb="2">Example queries:</Text>
          <Flex gap="2" wrap="wrap">
            {[
              'Show total trading volume by security type',
              'What are the top performing traders this week?',
              'List all option trades with PnL > $1000',
              'Compare equity vs derivative trading volumes',
              'Show failed orders in the last hour'
            ].map((example) => (
              <Badge
                key={example}
                variant="soft"
                style={{ cursor: 'pointer' }}
                onClick={() => setQuery(example)}
              >
                {example}
              </Badge>
            ))}
          </Flex>
        </Box>

        {/* Conversation Display */}
        {conversation.length > 0 && (
          <Card mb="4">
            <Heading size="4" mb="3">Conversation History</Heading>
            <ScrollArea style={{ maxHeight: '800px' }}>
              {conversation.map((item, index) => (
                <Box key={item.id} mb="4">
                  {/* User Question */}
                  <Flex align="start" gap="3" mb="3">
                    <Box style={{ 
                      minWidth: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      backgroundColor: item.type === 'followup' ? 'var(--violet-9)' : 'var(--blue-9)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontSize: '14px',
                      fontWeight: 'bold'
                    }}>
                      {item.type === 'followup' ? 'F' : 'Q'}
                    </Box>
                    <Box style={{ flex: 1 }}>
                      <Flex align="center" gap="2" mb="1">
                        <Text size="2" weight="bold">
                          {item.type === 'followup' ? 'Follow-up Question' : 'Your Question'}
                        </Text>
                        <Badge size="1" color={item.type === 'followup' ? 'violet' : 'blue'}>
                          #{index + 1}
                        </Badge>
                        <Text size="1" color="gray">
                          {item.timestamp.toLocaleTimeString()}
                        </Text>
                      </Flex>
                      <Box p="3" style={{
                        backgroundColor: item.type === 'followup' ? 'var(--violet-2)' : 'var(--blue-2)',
                        border: `1px solid ${item.type === 'followup' ? 'var(--violet-6)' : 'var(--blue-6)'}`,
                        borderRadius: 'var(--radius-2)'
                      }}>
                        <Text size="3">{item.query}</Text>
                      </Box>
                    </Box>
                  </Flex>

                  {/* AI Response */}
                  <Flex align="start" gap="3" ml="4">
                    <Box style={{ 
                      minWidth: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      backgroundColor: 'var(--green-9)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontSize: '14px',
                      fontWeight: 'bold'
                    }}>
                      AI
                    </Box>
                    <Box style={{ flex: 1 }}>
                      {item.isLoading ? (
                        <Box p="3" style={{
                          backgroundColor: 'var(--gray-2)',
                          border: '1px solid var(--gray-6)',
                          borderRadius: 'var(--radius-2)'
                        }}>
                          <Flex align="center" gap="2">
                            <UpdateIcon className="animate-spin" />
                            <Text>Analyzing your query...</Text>
                          </Flex>
                        </Box>
                      ) : item.response ? (
                        <ConversationResponse response={item.response} onFollowUp={handleFollowUpQuestion} />
                      ) : (
                        <Box p="3" style={{
                          backgroundColor: 'var(--red-2)',
                          border: '1px solid var(--red-6)',
                          borderRadius: 'var(--radius-2)'
                        }}>
                          <Text color="red">Sorry, there was an error processing your query.</Text>
                        </Box>
                      )}
                    </Box>
                  </Flex>
                </Box>
              ))}
            </ScrollArea>
          </Card>
        )}

        {/* Error display for current query */}
        {queryMutation.isError && (
          <Callout.Root color="red" mb="4">
            <Callout.Icon>
              <InfoCircledIcon />
            </Callout.Icon>
            <Callout.Text>
              {(queryMutation.error as any)?.response?.data?.error || 'An error occurred'}
            </Callout.Text>
          </Callout.Root>
        )}

      </Card>

        </Tabs.Content>
        
        <Tabs.Content value="schema">
          <Card>
            <Heading size="5" mb="4">
              <Flex align="center" gap="2">
                <Share2Icon />
                Database Schema Visualization
              </Flex>
            </Heading>
            <Text size="2" color="gray" mb="4">
              Interactive graph showing the relationships between fact and dimension tables in our star schema
            </Text>
            <DatabaseGraphVisualization />
          </Card>
        </Tabs.Content>
        
        <Tabs.Content value="neo4j">
          <Card>
            <Heading size="5" mb="4">
              <Flex align="center" gap="2">
                <Share2Icon />
                Graph-Based Schema Navigation (Neo4j)
              </Flex>
            </Heading>
            <Text size="2" color="gray" mb="4">
              Advanced schema exploration with automatic join path detection and SQL generation
            </Text>
            <Neo4jSchemaGraphWrapper />
          </Card>
        </Tabs.Content>
        
        <Tabs.Content value="relevance">
          <TableRelevanceVisualization />
        </Tabs.Content>
      </Tabs.Root>
    </Box>
  );
};

export default QueryInterface;