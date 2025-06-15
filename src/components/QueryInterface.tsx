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
  Callout
} from '@radix-ui/themes';
import {
  PaperPlaneIcon,
  CodeIcon,
  MagicWandIcon,
  QuestionMarkCircledIcon,
  InfoCircledIcon,
  ClockIcon
} from '@radix-ui/react-icons';
import * as Accordion from '@radix-ui/react-accordion';
import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { QueryRequest, QueryResponse } from '@/models/types';

const QueryInterface: React.FC = () => {
  const [query, setQuery] = useState('');
  const [queryHistory, setQueryHistory] = useState<Array<{ query: string; timestamp: Date }>>([]);
  const [currentResponse, setCurrentResponse] = useState<QueryResponse | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const queryMutation = useMutation({
    mutationFn: async (request: QueryRequest) => {
      const response = await axios.post('http://localhost:3000/api/query', request);
      return response.data;
    },
    onSuccess: (data) => {
      setCurrentResponse(data);
      setQueryHistory(prev => [...prev, { query, timestamp: new Date() }]);
      if (!data.clarificationNeeded) {
        setQuery('');
      }
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
      queryMutation.mutate({ query, followUp: queryHistory.length > 0 });
    }
  };

  const handleFollowUpQuestion = (question: string) => {
    setQuery(question);
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

  return (
    <Box>
      <Card>
        <Heading size="5" mb="4">Natural Language Query Interface</Heading>
        
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

        {/* Error display */}
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

        {/* Clarification needed */}
        {currentResponse?.clarificationNeeded && (
          <Callout.Root color="amber" mb="4">
            <Callout.Icon>
              <QuestionMarkCircledIcon />
            </Callout.Icon>
            <Callout.Text>
              <Text weight="bold" mb="2">{currentResponse.clarificationNeeded.ambiguity}</Text>
              <Flex gap="2" wrap="wrap" mt="2">
                {currentResponse.clarificationNeeded.suggestions.map((suggestion) => (
                  <Badge
                    key={suggestion}
                    variant="soft"
                    style={{ cursor: 'pointer' }}
                    onClick={() => handleClarification(suggestion)}
                  >
                    {suggestion}
                  </Badge>
                ))}
              </Flex>
            </Callout.Text>
          </Callout.Root>
        )}

        {/* Results display */}
        {currentResponse && !currentResponse.clarificationNeeded && (
          <Box>
            <Accordion.Root type="multiple" defaultValue={['sql', 'results', 'insights']}>
              {/* SQL Query */}
              <Accordion.Item value="sql">
                <Accordion.Header>
                  <Accordion.Trigger style={{ 
                    width: '100%', 
                    padding: 'var(--space-3)', 
                    backgroundColor: 'var(--gray-2)',
                    border: 'none',
                    borderRadius: 'var(--radius-2)',
                    cursor: 'pointer',
                    marginBottom: 'var(--space-2)'
                  }}>
                    <Flex align="center" gap="2">
                      <CodeIcon />
                      <Text>Generated SQL Query</Text>
                    </Flex>
                  </Accordion.Trigger>
                </Accordion.Header>
                <Accordion.Content>
                  <Card style={{ backgroundColor: 'var(--gray-3)' }}>
                    <Code size="2">
                      <pre style={{ margin: 0 }}>{currentResponse.sql}</pre>
                    </Code>
                    {currentResponse.explanation && (
                      <Text size="2" color="gray" mt="3">
                        {currentResponse.explanation}
                      </Text>
                    )}
                  </Card>
                </Accordion.Content>
              </Accordion.Item>

              {/* Query Results */}
              <Accordion.Item value="results">
                <Accordion.Header>
                  <Accordion.Trigger style={{ 
                    width: '100%', 
                    padding: 'var(--space-3)', 
                    backgroundColor: 'var(--gray-2)',
                    border: 'none',
                    borderRadius: 'var(--radius-2)',
                    cursor: 'pointer',
                    marginBottom: 'var(--space-2)'
                  }}>
                    <Text>Query Results ({currentResponse.results.length} rows)</Text>
                  </Accordion.Trigger>
                </Accordion.Header>
                <Accordion.Content>
                  <Card>
                    {renderTableData(currentResponse.results)}
                  </Card>
                </Accordion.Content>
              </Accordion.Item>

              {/* Insights */}
              {currentResponse.insights && currentResponse.insights.length > 0 && (
                <Accordion.Item value="insights">
                  <Accordion.Header>
                    <Accordion.Trigger style={{ 
                      width: '100%', 
                      padding: 'var(--space-3)', 
                      backgroundColor: 'var(--gray-2)',
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
                    <Card>
                      {currentResponse.insights.map((insight, idx) => (
                        <Box key={idx} mb={idx < currentResponse.insights.length - 1 ? "3" : "0"}>
                          <Text size="2">{insight}</Text>
                          {idx < currentResponse.insights.length - 1 && <Separator size="4" />}
                        </Box>
                      ))}
                    </Card>
                  </Accordion.Content>
                </Accordion.Item>
              )}

              {/* Follow-up Questions */}
              {currentResponse.followUpQuestions && currentResponse.followUpQuestions.length > 0 && (
                <Accordion.Item value="followup">
                  <Accordion.Header>
                    <Accordion.Trigger style={{ 
                      width: '100%', 
                      padding: 'var(--space-3)', 
                      backgroundColor: 'var(--gray-2)',
                      border: 'none',
                      borderRadius: 'var(--radius-2)',
                      cursor: 'pointer'
                    }}>
                      <Flex align="center" gap="2">
                        <QuestionMarkCircledIcon />
                        <Text>Suggested Follow-up Questions</Text>
                      </Flex>
                    </Accordion.Trigger>
                  </Accordion.Header>
                  <Accordion.Content>
                    <Card>
                      {currentResponse.followUpQuestions.map((question, idx) => (
                        <Box
                          key={idx}
                          p="2"
                          mb="2"
                          style={{ 
                            backgroundColor: 'var(--gray-2)', 
                            borderRadius: 'var(--radius-2)',
                            cursor: 'pointer'
                          }}
                          onClick={() => handleFollowUpQuestion(question)}
                        >
                          <Text size="2">{question}</Text>
                        </Box>
                      ))}
                    </Card>
                  </Accordion.Content>
                </Accordion.Item>
              )}
            </Accordion.Root>
          </Box>
        )}
      </Card>

      {/* Query History */}
      {queryHistory.length > 0 && (
        <Card mt="4">
          <Heading size="4" mb="3">Query History</Heading>
          {queryHistory.slice(-5).reverse().map((item, idx) => (
            <Box
              key={idx}
              p="2"
              mb="2"
              style={{ 
                backgroundColor: 'var(--gray-2)', 
                borderRadius: 'var(--radius-2)',
                cursor: 'pointer'
              }}
              onClick={() => setQuery(item.query)}
            >
              <Text size="2">{item.query}</Text>
              <Text size="1" color="gray">{item.timestamp.toLocaleTimeString()}</Text>
            </Box>
          ))}
        </Card>
      )}
    </Box>
  );
};

export default QueryInterface;