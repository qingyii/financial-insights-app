import React, { useState, useEffect } from 'react';
import { Box, Card, Heading, Text, Badge, Flex, TextArea, Button, Progress, Grid, Callout, Tabs } from '@radix-ui/themes';
import { MagnifyingGlassIcon, InfoCircledIcon, LightningBoltIcon } from '@radix-ui/react-icons';
import { motion, AnimatePresence } from 'framer-motion';
import { tableRelevanceService } from '@/services/neo4jTableRelevance';
import { TableRelevanceBubbles } from './TableRelevanceBubbles';

interface TableRelevanceData {
  table: string;
  relevanceScore: number;
  reasons: string[];
  relatedTables: Array<{ table: string; relationship: string; weight: number }>;
  suggestedColumns: string[];
}

export const TableRelevanceVisualization: React.FC = () => {
  const [query, setQuery] = useState('');
  const [relevanceData, setRelevanceData] = useState<TableRelevanceData[]>([]);
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  useEffect(() => {
    // Initialize the service
    tableRelevanceService.connect();
  }, []);

  useEffect(() => {
    // Get query suggestions as user types
    const delayDebounce = setTimeout(async () => {
      if (query.length > 3) {
        const newSuggestions = await tableRelevanceService.getQuerySuggestions(query);
        setSuggestions(newSuggestions);
      } else {
        setSuggestions([]);
      }
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [query]);

  const analyzeQuery = async () => {
    if (!query.trim()) return;

    setLoading(true);
    try {
      const relevance = await tableRelevanceService.calculateTableRelevance(query);
      setRelevanceData(relevance);
    } catch (error) {
      console.error('Failed to analyze query:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRelevanceColor = (score: number): string => {
    if (score >= 0.8) return 'green';
    if (score >= 0.6) return 'blue';
    if (score >= 0.4) return 'amber';
    return 'gray';
  };

  const getRelevanceLabel = (score: number): string => {
    if (score >= 0.8) return 'Highly Relevant';
    if (score >= 0.6) return 'Relevant';
    if (score >= 0.4) return 'Somewhat Relevant';
    return 'Low Relevance';
  };

  return (
    <Box>
      <Card mb="4">
        <Heading size="4" mb="3">
          <Flex align="center" gap="2">
            <LightningBoltIcon />
            Schema Intelligence - Table Relevance Analysis
          </Flex>
        </Heading>
        <Text size="2" color="gray" mb="3">
          AI-powered table selection using Neo4j graph analysis to find optimal query paths
        </Text>
        
        <Flex gap="3" mb="3">
          <Box style={{ flex: 1 }}>
            <TextArea
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Enter your query to see which tables are most relevant..."
              size="3"
              style={{ minHeight: 80 }}
            />
          </Box>
          <Button 
            onClick={analyzeQuery} 
            disabled={loading || !query.trim()}
            size="3"
          >
            <MagnifyingGlassIcon />
            Analyze
          </Button>
        </Flex>

        {/* Query Suggestions */}
        <AnimatePresence>
          {suggestions.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <Box mb="3">
                <Text size="2" color="gray" mb="2">Suggestions:</Text>
                <Flex gap="2" wrap="wrap">
                  {suggestions.map((suggestion, idx) => (
                    <Badge
                      key={idx}
                      variant="soft"
                      color="blue"
                      style={{ cursor: 'pointer' }}
                      onClick={() => setQuery(suggestion)}
                    >
                      <LightningBoltIcon width="12" height="12" />
                      {suggestion}
                    </Badge>
                  ))}
                </Flex>
              </Box>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Sample Queries */}
        <Box>
          <Text size="2" color="gray" mb="2">Try these examples:</Text>
          <Flex gap="2" wrap="wrap">
            {[
              'Show me top traders by PnL',
              'What securities are trading today?',
              'Failed orders from Goldman Sachs',
              'Trading volume by security type',
              'Options trading performance this week'
            ].map((example) => (
              <Badge
                key={example}
                variant="outline"
                style={{ cursor: 'pointer' }}
                onClick={() => {
                  setQuery(example);
                  analyzeQuery();
                }}
              >
                {example}
              </Badge>
            ))}
          </Flex>
        </Box>
      </Card>

      {/* Relevance Results */}
      <AnimatePresence>
        {relevanceData.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Tabs.Root defaultValue="cards">
              <Tabs.List mb="4">
                <Tabs.Trigger value="cards">Detailed Analysis</Tabs.Trigger>
                <Tabs.Trigger value="heatmap">Bubble Visualization</Tabs.Trigger>
              </Tabs.List>
              
              <Tabs.Content value="cards">
            <Grid columns={{ initial: '1', md: '2' }} gap="4">
              {relevanceData.map((data, idx) => (
                <motion.div
                  key={data.table}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.1 }}
                >
                  <Card 
                    style={{ 
                      borderLeft: `4px solid var(--${getRelevanceColor(data.relevanceScore)}-9)`,
                      height: '100%'
                    }}
                  >
                    <Flex justify="between" align="start" mb="3">
                      <Box>
                        <Heading size="3" mb="1">{data.table}</Heading>
                        <Badge color={getRelevanceColor(data.relevanceScore)} size="2">
                          {getRelevanceLabel(data.relevanceScore)}
                        </Badge>
                      </Box>
                      <Box style={{ minWidth: '80px' }}>
                        <Text size="1" color="gray">Relevance</Text>
                        <Text size="3" weight="bold">
                          {(data.relevanceScore * 100).toFixed(0)}%
                        </Text>
                      </Box>
                    </Flex>

                    {/* Relevance Progress Bar */}
                    <Box mb="3">
                      <Progress 
                        value={data.relevanceScore * 100} 
                        size="2" 
                        color={getRelevanceColor(data.relevanceScore) as any}
                      />
                    </Box>

                    {/* Reasons */}
                    <Box mb="3">
                      <Text size="2" weight="medium" mb="2">Why this table?</Text>
                      <Box>
                        {data.reasons.map((reason, idx) => (
                          <Flex key={idx} gap="2" mb="1">
                            <Text size="1" color="gray">•</Text>
                            <Text size="2">{reason}</Text>
                          </Flex>
                        ))}
                      </Box>
                    </Box>

                    {/* Suggested Columns */}
                    {data.suggestedColumns.length > 0 && (
                      <Box mb="3">
                        <Text size="2" weight="medium" mb="2">Suggested columns:</Text>
                        <Flex gap="2" wrap="wrap">
                          {data.suggestedColumns.map((column) => (
                            <Badge key={column} variant="soft" size="1">
                              {column}
                            </Badge>
                          ))}
                        </Flex>
                      </Box>
                    )}

                    {/* Related Tables */}
                    {data.relatedTables.length > 0 && (
                      <Box>
                        <Text size="2" weight="medium" mb="2">Related tables:</Text>
                        {data.relatedTables.map((related, idx) => (
                          <Flex key={idx} justify="between" mb="1">
                            <Text size="2">{related.table}</Text>
                            <Text size="1" color="gray">via {related.relationship}</Text>
                          </Flex>
                        ))}
                      </Box>
                    )}
                  </Card>
                </motion.div>
              ))}
            </Grid>

            {/* Recommended SQL Structure */}
            <Card mt="4">
              <Heading size="3" mb="3">Recommended Query Structure</Heading>
              <Box style={{ 
                backgroundColor: 'var(--gray-3)', 
                padding: 'var(--space-3)',
                borderRadius: 'var(--radius-2)',
                fontFamily: 'monospace'
              }}>
                <Text size="2">
                  SELECT
                  {relevanceData[0]?.suggestedColumns.length > 0 && (
                    <span style={{ color: 'var(--blue-11)' }}>
                      {' ' + relevanceData[0].suggestedColumns.slice(0, 3).join(', ')}
                    </span>
                  )}
                  <br />
                  FROM {relevanceData[0]?.table}
                  {relevanceData.slice(1, 3).map((data) => (
                    <React.Fragment key={data.table}>
                      <br />
                      JOIN {data.table} ON ...
                    </React.Fragment>
                  ))}
                  {query.toLowerCase().includes('where') && (
                    <>
                      <br />
                      WHERE ...
                    </>
                  )}
                  {relevanceData[0]?.reasons.some(r => r.includes('aggregation')) && (
                    <>
                      <br />
                      GROUP BY ...
                    </>
                  )}
                </Text>
              </Box>
            </Card>
              </Tabs.Content>
              
              <Tabs.Content value="heatmap">
                <TableRelevanceBubbles query={query} relevanceData={relevanceData} />
              </Tabs.Content>
            </Tabs.Root>
          </motion.div>
        )}
      </AnimatePresence>

      {loading && (
        <Flex justify="center" align="center" style={{ height: '200px' }}>
          <Text>Analyzing query relevance...</Text>
        </Flex>
      )}
    </Box>
  );
};