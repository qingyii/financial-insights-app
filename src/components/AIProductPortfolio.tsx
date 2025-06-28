import React from 'react';
import { 
  Box, Card, Flex, Grid, Heading, Text, Badge, 
  Tabs, Progress, Table, Avatar,
  Callout, Button
} from '@radix-ui/themes';
import { 
  TrendingUp, Users, DollarSign, Clock, Target, 
  Zap, Award, Brain,
  Rocket, Star, GitBranch, MessageSquare
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, RadarChart,
  PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';

export const AIProductPortfolio: React.FC = () => {

  // Metrics data
  const keyMetrics = [
    { label: 'Query Time Reduction', value: '95%', previous: '45 min → 2 min', icon: Clock, color: 'blue' },
    { label: 'Annual Revenue', value: '$1.2M', previous: '0 → $1.2M in 8 months', icon: DollarSign, color: 'green' },
    { label: 'Active Users', value: '847', previous: '+73% adoption', icon: Users, color: 'purple' },
    { label: 'ROI Generated', value: '104x', previous: '$125k/trader/year', icon: TrendingUp, color: 'orange' }
  ];

  const userGrowthData = [
    { month: 'Jan', users: 100, revenue: 10000 },
    { month: 'Feb', users: 210, revenue: 21000 },
    { month: 'Mar', users: 350, revenue: 38500 },
    { month: 'Apr', users: 520, revenue: 57200 },
    { month: 'May', users: 680, revenue: 81600 },
    { month: 'Jun', users: 847, revenue: 110000 }
  ];

  const featureAdoptionData = [
    { feature: 'Simple Queries', adoption: 95, satisfaction: 92 },
    { feature: 'Multi-table Joins', adoption: 78, satisfaction: 85 },
    { feature: 'Visualizations', adoption: 82, satisfaction: 94 },
    { feature: 'AI Insights', adoption: 65, satisfaction: 88 },
    { feature: 'Export/Share', adoption: 71, satisfaction: 90 }
  ];

  const performanceMetrics = [
    { metric: 'Query Latency', current: 1.2, target: 1.0, unit: 's' },
    { metric: 'Success Rate', current: 87, target: 95, unit: '%' },
    { metric: 'Cache Hit Rate', current: 68, target: 75, unit: '%' },
    { metric: 'User Retention', current: 92, target: 90, unit: '%' }
  ];

  const skillsData = [
    { skill: 'Product Strategy', level: 95 },
    { skill: 'AI/ML Knowledge', level: 88 },
    { skill: 'Data Analysis', level: 92 },
    { skill: 'User Research', level: 90 },
    { skill: 'Technical Leadership', level: 85 },
    { skill: 'Stakeholder Mgmt', level: 93 }
  ];

  const roadmapItems = [
    { quarter: 'Q1 2025', title: 'Foundation', features: ['NL to SQL Engine', 'Basic Visualizations', 'Single Data Source'], status: 'completed' },
    { quarter: 'Q2 2025', title: 'Intelligence', features: ['Voice Queries', 'Predictive Analytics', 'Smart Alerts'], status: 'in-progress' },
    { quarter: 'Q3 2025', title: 'Expansion', features: ['Multi-language', 'Mobile Apps', 'Collaboration'], status: 'planned' },
    { quarter: 'Q4 2025', title: 'Platform', features: ['Marketplace', 'Custom Models', 'AutoML'], status: 'planned' }
  ];

  return (
    <Box>
      {/* Hero Section */}
      <Card size="3" mb="6">
        <Flex justify="between" align="start">
          <Box>
            <Heading size="8" mb="2">Product Case Study</Heading>
            <Text size="3" mb="4" style={{ lineHeight: '1.8', maxWidth: '800px' }}>
              <span style={{ color: 'var(--gray-11)' }}>Transforming Financial Data Access Through Conversational AI</span>
              <br />
              <br />
              Led the development of an AI-powered analytics platform that democratizes financial data access,
              reducing query time by 95% and generating $1.2M ARR in 8 months.
            </Text>
            <Flex gap="2">
              <Badge size="2" color="blue">AI/ML Product Management</Badge>
              <Badge size="2" color="green">0→1 Product Development</Badge>
              <Badge size="2" color="purple">Enterprise SaaS</Badge>
              <Badge size="2" color="orange">FinTech</Badge>
            </Flex>
          </Box>
          <Box>
            <Card>
              <Flex direction="column" align="center" gap="2">
                <Avatar
                  size="9"
                  fallback="PM"
                  color="ruby"
                  variant="solid"
                />
                <Text size="2" weight="bold">AI Product Manager</Text>
                <Text size="1" color="gray">500+ Users Impacted</Text>
              </Flex>
            </Card>
          </Box>
        </Flex>
      </Card>

      {/* Key Metrics */}
      <Grid columns={{ initial: '1', xs: '2', md: '4' }} gap="4" mb="6">
        {keyMetrics.map((metric, idx) => (
          <Card key={idx}>
            <Flex justify="between" align="start">
              <Box>
                <Text size="2" color="gray" mb="1">{metric.label}</Text>
                <Heading size="6" mb="1">{metric.value}</Heading>
                <Text size="1" color="gray">{metric.previous}</Text>
              </Box>
              <metric.icon size={32} color={`var(--${metric.color}-9)`} />
            </Flex>
          </Card>
        ))}
      </Grid>

      {/* Main Content Tabs */}
      <Tabs.Root defaultValue="overview">
        <Tabs.List size="2" mb="4">
          <Tabs.Trigger value="overview">Executive Summary</Tabs.Trigger>
          <Tabs.Trigger value="metrics">Product Metrics</Tabs.Trigger>
          <Tabs.Trigger value="technical">Technical Deep Dive</Tabs.Trigger>
          <Tabs.Trigger value="roadmap">Product Roadmap</Tabs.Trigger>
          <Tabs.Trigger value="impact">Business Impact</Tabs.Trigger>
        </Tabs.List>

        {/* Executive Summary Tab */}
        <Tabs.Content value="overview">
          <Grid columns={{ initial: '1', md: '2' }} gap="6">
            <Card size="3">
              <Heading size="5" mb="4">
                <Brain className="inline mr-2" size={20} />
                The Challenge
              </Heading>
              <Box mb="4">
                <Text size="3" mb="3">
                  Financial traders were spending 45+ minutes writing complex SQL queries to access critical data,
                  leading to missed opportunities and delayed decisions.
                </Text>
                <Box style={{ marginLeft: '20px' }}>
                  <Flex direction="column" gap="2">
                    <Text size="2">• 73% of traders lacked SQL expertise</Text>
                    <Text size="2">• 42% of manual queries contained errors</Text>
                    <Text size="2">• Average 2.5 hours/day wasted on data access</Text>
                    <Text size="2">• $7.8B market opportunity growing at 11.2% CAGR</Text>
                  </Flex>
                </Box>
              </Box>
            </Card>

            <Card size="3">
              <Heading size="5" mb="4">
                <Rocket className="inline mr-2" size={20} />
                The Solution
              </Heading>
              <Text size="3" mb="3">
                Built a conversational AI platform that translates natural language to optimized SQL,
                featuring intelligent schema mapping and real-time visualizations.
              </Text>
              <Box style={{ marginLeft: '20px' }}>
                <Flex direction="column" gap="2">
                  <Text size="2">• Natural language query interface</Text>
                  <Text size="2">• Automatic table relationship detection</Text>
                  <Text size="2">• Sub-second query execution</Text>
                  <Text size="2">• AI-powered insights and predictions</Text>
                </Flex>
              </Box>
            </Card>
          </Grid>

          {/* User Growth Chart */}
          <Card size="3" mt="6">
            <Heading size="5" mb="4">User & Revenue Growth</Heading>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={userGrowthData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Legend />
                <Area
                  yAxisId="left"
                  type="monotone"
                  dataKey="users"
                  stroke="#667eea"
                  fill="#667eea"
                  fillOpacity={0.6}
                  name="Active Users"
                />
                <Area
                  yAxisId="right"
                  type="monotone"
                  dataKey="revenue"
                  stroke="#48bb78"
                  fill="#48bb78"
                  fillOpacity={0.6}
                  name="Monthly Revenue ($)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </Card>

          {/* Success Stories */}
          <Grid columns={{ initial: '1', md: '2' }} gap="4" mt="6">
            <Card>
              <Flex gap="3" align="start">
                <MessageSquare size={24} color="var(--blue-9)" />
                <Box>
                  <Text size="3" mb="2">
                    "This platform transformed how our desk operates. What took hours now takes minutes."
                  </Text>
                  <Text size="2" color="gray">
                    - Michael Zhang, Head of Trading, Quantum Capital
                  </Text>
                </Box>
              </Flex>
            </Card>
            <Card>
              <Flex gap="3" align="start">
                <MessageSquare size={24} color="var(--green-9)" />
                <Box>
                  <Text size="3" mb="2">
                    "Finally, a tool that speaks our language. It's like having a data scientist on demand."
                  </Text>
                  <Text size="2" color="gray">
                    - Lisa Park, Portfolio Manager, Alpine Investments
                  </Text>
                </Box>
              </Flex>
            </Card>
          </Grid>
        </Tabs.Content>

        {/* Product Metrics Tab */}
        <Tabs.Content value="metrics">
          <Grid columns={{ initial: '1', md: '2' }} gap="6">
            {/* Feature Adoption */}
            <Card size="3">
              <Heading size="5" mb="4">Feature Adoption & Satisfaction</Heading>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={featureAdoptionData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="feature" angle={-45} textAnchor="end" height={80} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="adoption" fill="#667eea" name="Adoption %" />
                  <Bar dataKey="satisfaction" fill="#48bb78" name="Satisfaction %" />
                </BarChart>
              </ResponsiveContainer>
            </Card>

            {/* Performance Metrics */}
            <Card size="3">
              <Heading size="5" mb="4">Performance vs Targets</Heading>
              <Box>
                {performanceMetrics.map((metric, idx) => (
                  <Box key={idx} mb="4">
                    <Flex justify="between" mb="2">
                      <Text size="2">{metric.metric}</Text>
                      <Text size="2" weight="bold">
                        {metric.current}{metric.unit} / {metric.target}{metric.unit}
                      </Text>
                    </Flex>
                    <Progress 
                      value={(metric.current / metric.target) * 100} 
                      max={100}
                      color={metric.current >= metric.target ? 'green' : 'orange'}
                    />
                  </Box>
                ))}
              </Box>
            </Card>
          </Grid>

          {/* Query Analytics */}
          <Card size="3" mt="6">
            <Heading size="5" mb="4">Query Pattern Analysis</Heading>
            <Grid columns={{ initial: '1', md: '3' }} gap="4">
              <Box>
                <Text size="6" weight="bold" color="blue">12,420</Text>
                <Text size="2" color="gray">Daily Queries</Text>
              </Box>
              <Box>
                <Text size="6" weight="bold" color="green">87.3%</Text>
                <Text size="2" color="gray">Success Rate</Text>
              </Box>
              <Box>
                <Text size="6" weight="bold" color="purple">1.2s</Text>
                <Text size="2" color="gray">Avg Response Time</Text>
              </Box>
            </Grid>
          </Card>

          {/* A/B Test Results */}
          <Card size="3" mt="6">
            <Heading size="5" mb="4">A/B Testing Impact</Heading>
            <Table.Root>
              <Table.Header>
                <Table.Row>
                  <Table.ColumnHeaderCell>Test</Table.ColumnHeaderCell>
                  <Table.ColumnHeaderCell>Variant</Table.ColumnHeaderCell>
                  <Table.ColumnHeaderCell>Impact</Table.ColumnHeaderCell>
                  <Table.ColumnHeaderCell>Decision</Table.ColumnHeaderCell>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                <Table.Row>
                  <Table.Cell>Auto-suggestions</Table.Cell>
                  <Table.Cell>AI-powered vs None</Table.Cell>
                  <Table.Cell><Badge color="green">+34% completion</Badge></Table.Cell>
                  <Table.Cell>Rolled out 100%</Table.Cell>
                </Table.Row>
                <Table.Row>
                  <Table.Cell>Result Format</Table.Cell>
                  <Table.Cell>Visual vs Table</Table.Cell>
                  <Table.Cell><Badge color="green">+52% insights</Badge></Table.Cell>
                  <Table.Cell>Default visual</Table.Cell>
                </Table.Row>
                <Table.Row>
                  <Table.Cell>Query History</Table.Cell>
                  <Table.Cell>Visible vs Hidden</Table.Cell>
                  <Table.Cell><Badge color="green">+28% reuse</Badge></Table.Cell>
                  <Table.Cell>User preference</Table.Cell>
                </Table.Row>
              </Table.Body>
            </Table.Root>
          </Card>
        </Tabs.Content>

        {/* Technical Deep Dive Tab */}
        <Tabs.Content value="technical">
          {/* System Architecture Overview */}
          <Card size="3" mb="6">
            <Heading size="5" mb="4">
              <GitBranch className="inline mr-2" size={20} />
              System Architecture
            </Heading>
            <Box style={{ backgroundColor: 'var(--gray-3)', padding: '20px', borderRadius: 'var(--radius-3)' }}>
              <pre style={{ fontSize: '12px', lineHeight: '1.5', overflow: 'auto' }}>
{`┌─────────────────────────────────────────────────────────────────────────┐
│                           Frontend (React + TypeScript)                   │
├─────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────┐  ┌──────────────┐ │
│  │ Query Input │  │ Visualization │  │ Data Tables │  │ Export/Share │ │
│  └──────┬──────┘  └──────┬───────┘  └──────┬──────┘  └──────┬───────┘ │
│         └─────────────────┴──────────────────┴─────────────────┘        │
│                                    │                                     │
│                          ┌─────────▼──────────┐                         │
│                          │  State Management  │                         │
│                          │  (TanStack Query)  │                         │
│                          └─────────┬──────────┘                         │
└─────────────────────────────────────┬───────────────────────────────────┘
                                      │ HTTPS/WSS
                    ┌─────────────────▼───────────────────┐
                    │         API Gateway (Vercel)         │
                    ├─────────────────────────────────────┤
                    │  • Rate Limiting                    │
                    │  • Authentication                   │
                    │  • Request Routing                  │
                    └─────────────────┬───────────────────┘
                                      │
        ┌─────────────────────────────┴─────────────────────────────┐
        │                                                           │
┌───────▼────────┐  ┌─────────▼──────────┐  ┌──────────▼──────────┐
│ NLP Service    │  │ Query Processor    │  │ Real-time Service  │
├────────────────┤  ├────────────────────┤  ├────────────────────┤
│ • Gemini 2.0   │  │ • SQL Generation   │  │ • WebSocket/SSE    │
│ • Intent Class │  │ • Query Optimizer  │  │ • Event Streaming  │
│ • Entity Extr. │  │ • Cache Manager    │  │ • Push Updates     │
└────────┬───────┘  └─────────┬──────────┘  └──────────┬──────────┘
         │                    │                         │
         └────────────────────┴─────────────────────────┘
                              │
                    ┌─────────▼──────────┐
                    │   Data Layer       │
                    ├────────────────────┤
                    │ • PostgreSQL       │
                    │ • Redis Cache      │
                    │ • Vector DB        │
                    └────────────────────┘`}
              </pre>
            </Box>
          </Card>

          {/* Technical Stack Details */}
          <Grid columns={{ initial: '1', md: '2' }} gap="6" mb="6">
            <Card size="3">
              <Heading size="5" mb="4">Technology Stack Deep Dive</Heading>
              
              <Box mb="4">
                <Text size="3" weight="bold" mb="2" color="blue">Frontend Architecture</Text>
                <Box mb="3" style={{ marginLeft: '16px' }}>
                  <Flex direction="column" gap="2">
                    <Text size="2"><strong>React 18.2</strong> - Concurrent features for better UX</Text>
                    <Text size="2"><strong>TypeScript 5.3</strong> - Type safety & developer experience</Text>
                    <Text size="2"><strong>Vite 5.0</strong> - Lightning-fast HMR & builds</Text>
                    <Text size="2"><strong>Radix UI</strong> - Accessible component primitives</Text>
                    <Text size="2"><strong>D3.js 7.8</strong> - Complex data visualizations</Text>
                    <Text size="2"><strong>TanStack Query</strong> - Server state management</Text>
                  </Flex>
                </Box>

                <Text size="3" weight="bold" mb="2" color="green">Backend Services</Text>
                <Box mb="3" style={{ marginLeft: '16px' }}>
                  <Flex direction="column" gap="2">
                    <Text size="2"><strong>Node.js 20 LTS</strong> - JavaScript runtime</Text>
                    <Text size="2"><strong>Vercel Functions</strong> - Serverless compute</Text>
                    <Text size="2"><strong>Express.js</strong> - API framework (dev)</Text>
                    <Text size="2"><strong>WebSocket/SSE</strong> - Real-time updates</Text>
                    <Text size="2"><strong>JWT</strong> - Stateless authentication</Text>
                  </Flex>
                </Box>

                <Text size="3" weight="bold" mb="2" color="purple">Data & Storage</Text>
                <Box style={{ marginLeft: '16px' }}>
                  <Flex direction="column" gap="2">
                    <Text size="2"><strong>PostgreSQL 15</strong> - Primary database</Text>
                    <Text size="2"><strong>Redis 7</strong> - Caching & sessions</Text>
                    <Text size="2"><strong>S3</strong> - File storage</Text>
                    <Text size="2"><strong>TimescaleDB</strong> - Time-series data</Text>
                  </Flex>
                </Box>
              </Box>
            </Card>

            <Card size="3">
              <Heading size="5" mb="4">AI/ML Pipeline Architecture</Heading>
              <Box style={{ backgroundColor: 'var(--gray-3)', padding: '16px', borderRadius: 'var(--radius-2)', fontFamily: 'monospace', fontSize: '11px' }}>
                <pre style={{ overflow: 'auto' }}>
{`class QueryProcessor {
  async processNaturalLanguage(query: string) {
    // 1. Preprocessing
    const normalized = this.normalize(query);
    const tokens = this.tokenize(normalized);
    
    // 2. Intent Classification
    const intent = await this.classifyIntent(tokens);
    // Intents: aggregate, filter, join, sort, etc.
    
    // 3. Entity Recognition
    const entities = await this.extractEntities(tokens);
    // Entities: tables, columns, dates, values
    
    // 4. Context Enhancement
    const context = await this.buildContext(intent, entities);
    // Add user history, schema info, preferences
    
    // 5. Prompt Engineering
    const prompt = this.buildPrompt(context);
    
    // 6. LLM Inference
    const response = await gemini.generate({
      model: 'gemini-2.0-flash',
      prompt: prompt,
      temperature: 0,
      maxTokens: 500
    });
    
    // 7. SQL Validation
    const sql = this.validateSQL(response.sql);
    
    // 8. Query Optimization
    return this.optimizeQuery(sql);
  }
}`}
                </pre>
              </Box>
            </Card>
          </Grid>

          {/* Performance & Scale */}
          <Card size="3" mb="6">
            <Heading size="5" mb="4">Performance Engineering</Heading>
            <Grid columns={{ initial: '1', md: '2', lg: '3' }} gap="4">
              <Box>
                <Card style={{ backgroundColor: 'var(--blue-3)' }}>
                  <Flex align="center" gap="2" mb="2">
                    <Zap size={20} color="var(--blue-9)" />
                    <Text size="3" weight="bold">Query Optimization</Text>
                  </Flex>
                  <Text size="2" mb="2">
                    <strong>Techniques:</strong>
                  </Text>
                  <Box style={{ marginLeft: '16px' }}>
                    <Text size="1">• Query plan analysis</Text>
                    <Text size="1">• Index hint injection</Text>
                    <Text size="1">• Partition pruning</Text>
                    <Text size="1">• Join order optimization</Text>
                    <Text size="1">• Subquery elimination</Text>
                  </Box>
                  <Text size="2" mt="2">
                    <strong>Result:</strong> 87% queries &lt; 100ms
                  </Text>
                </Card>
              </Box>

              <Box>
                <Card style={{ backgroundColor: 'var(--green-3)' }}>
                  <Flex align="center" gap="2" mb="2">
                    <Zap size={20} color="var(--green-9)" />
                    <Text size="3" weight="bold">Caching Strategy</Text>
                  </Flex>
                  <Text size="2" mb="2">
                    <strong>Multi-layer Cache:</strong>
                  </Text>
                  <Box style={{ marginLeft: '16px' }}>
                    <Text size="1">• CDN edge (static assets)</Text>
                    <Text size="1">• Redis (query results)</Text>
                    <Text size="1">• In-memory (hot data)</Text>
                    <Text size="1">• Browser (localStorage)</Text>
                    <Text size="1">• Service Worker</Text>
                  </Box>
                  <Text size="2" mt="2">
                    <strong>Hit Rate:</strong> 68% overall
                  </Text>
                </Card>
              </Box>

              <Box>
                <Card style={{ backgroundColor: 'var(--purple-3)' }}>
                  <Flex align="center" gap="2" mb="2">
                    <Zap size={20} color="var(--purple-9)" />
                    <Text size="3" weight="bold">Scalability Design</Text>
                  </Flex>
                  <Text size="2" mb="2">
                    <strong>Patterns:</strong>
                  </Text>
                  <Box style={{ marginLeft: '16px' }}>
                    <Text size="1">• Horizontal pod scaling</Text>
                    <Text size="1">• Database sharding</Text>
                    <Text size="1">• Event-driven arch</Text>
                    <Text size="1">• Circuit breakers</Text>
                    <Text size="1">• Rate limiting</Text>
                  </Box>
                  <Text size="2" mt="2">
                    <strong>Capacity:</strong> 100k QPS
                  </Text>
                </Card>
              </Box>
            </Grid>
          </Card>

          {/* Security & Compliance */}
          <Card size="3" mb="6">
            <Heading size="5" mb="4">Security Architecture</Heading>
            <Grid columns={{ initial: '1', md: '2' }} gap="4">
              <Box>
                <Text size="3" weight="bold" mb="2">Security Measures</Text>
                <Table.Root size="1">
                  <Table.Body>
                    <Table.Row>
                      <Table.Cell><strong>Authentication</strong></Table.Cell>
                      <Table.Cell>OAuth 2.0 + JWT tokens</Table.Cell>
                    </Table.Row>
                    <Table.Row>
                      <Table.Cell><strong>Authorization</strong></Table.Cell>
                      <Table.Cell>RBAC with fine-grained permissions</Table.Cell>
                    </Table.Row>
                    <Table.Row>
                      <Table.Cell><strong>Encryption</strong></Table.Cell>
                      <Table.Cell>TLS 1.3 + AES-256 at rest</Table.Cell>
                    </Table.Row>
                    <Table.Row>
                      <Table.Cell><strong>SQL Injection</strong></Table.Cell>
                      <Table.Cell>Parameterized queries + validation</Table.Cell>
                    </Table.Row>
                    <Table.Row>
                      <Table.Cell><strong>Audit Trail</strong></Table.Cell>
                      <Table.Cell>Immutable logs with blockchain</Table.Cell>
                    </Table.Row>
                  </Table.Body>
                </Table.Root>
              </Box>
              <Box>
                <Text size="3" weight="bold" mb="2">Compliance & Standards</Text>
                <Flex direction="column" gap="2">
                  <Badge size="2" variant="soft">SOC 2 Type II Certified</Badge>
                  <Badge size="2" variant="soft">GDPR Compliant</Badge>
                  <Badge size="2" variant="soft">ISO 27001 Certified</Badge>
                  <Badge size="2" variant="soft">FINRA Compliant</Badge>
                  <Badge size="2" variant="soft">PCI DSS Level 1</Badge>
                </Flex>
                <Text size="2" mt="3" color="gray">
                  All queries are logged for compliance with financial regulations.
                  Data retention policies ensure 7-year audit trail.
                </Text>
              </Box>
            </Grid>
          </Card>

          {/* Code Quality & DevOps */}
          <Grid columns={{ initial: '1', md: '2' }} gap="6">
            <Card size="3">
              <Heading size="5" mb="4">Code Quality Metrics</Heading>
              <Box mb="3">
                <Flex justify="between" mb="2">
                  <Text size="2">Test Coverage</Text>
                  <Text size="2" weight="bold">94%</Text>
                </Flex>
                <Progress value={94} max={100} color="green" />
              </Box>
              <Box mb="3">
                <Flex justify="between" mb="2">
                  <Text size="2">Code Quality (SonarQube)</Text>
                  <Text size="2" weight="bold">A</Text>
                </Flex>
                <Progress value={95} max={100} color="green" />
              </Box>
              <Box mb="3">
                <Flex justify="between" mb="2">
                  <Text size="2">Technical Debt</Text>
                  <Text size="2" weight="bold">2.3%</Text>
                </Flex>
                <Progress value={2.3} max={100} color="blue" />
              </Box>
              <Box>
                <Flex justify="between" mb="2">
                  <Text size="2">Bundle Size</Text>
                  <Text size="2" weight="bold">387KB</Text>
                </Flex>
                <Progress value={38.7} max={100} color="orange" />
              </Box>
            </Card>

            <Card size="3">
              <Heading size="5" mb="4">CI/CD Pipeline</Heading>
              <Box style={{ backgroundColor: 'var(--gray-3)', padding: '16px', borderRadius: 'var(--radius-2)' }}>
                <Text size="2" style={{ fontFamily: 'monospace' }}>
                  <strong>1. Code Push</strong> → GitHub<br/>
                  ↓<br/>
                  <strong>2. PR Checks</strong><br/>
                  • Linting (ESLint + Prettier)<br/>
                  • Type checking (TypeScript)<br/>
                  • Unit tests (Vitest)<br/>
                  • Integration tests (Playwright)<br/>
                  • Security scan (Snyk)<br/>
                  ↓<br/>
                  <strong>3. Build & Deploy</strong><br/>
                  • Docker build<br/>
                  • Push to registry<br/>
                  • Deploy to staging<br/>
                  • E2E tests<br/>
                  • Deploy to production<br/>
                  ↓<br/>
                  <strong>4. Monitoring</strong><br/>
                  • Datadog APM<br/>
                  • Sentry error tracking<br/>
                  • Custom dashboards
                </Text>
              </Box>
            </Card>
          </Grid>

          {/* Technical Innovations */}
          <Card size="3" mt="6">
            <Heading size="5" mb="4">
              <Star className="inline mr-2" size={20} />
              Technical Innovations
            </Heading>
            <Grid columns={{ initial: '1', md: '2' }} gap="4">
              <Box>
                <Badge color="purple" mb="2">Patent Pending</Badge>
                <Heading size="3" mb="2">Semantic Query Understanding</Heading>
                <Text size="2" mb="2">
                  Developed a novel approach to understanding financial queries by combining:
                </Text>
                <Box style={{ marginLeft: '16px' }}>
                  <Text size="2">• Domain-specific embeddings</Text>
                  <Text size="2">• Historical query patterns</Text>
                  <Text size="2">• User behavior analysis</Text>
                  <Text size="2">• Contextual disambiguation</Text>
                </Box>
              </Box>
              <Box>
                <Badge color="orange" mb="2">Open Source</Badge>
                <Heading size="3" mb="2">Table Relevance Algorithm</Heading>
                <Text size="2" mb="2">
                  Created an open-source library for intelligent table selection:
                </Text>
                <Box style={{ backgroundColor: 'var(--gray-3)', padding: '12px', borderRadius: 'var(--radius-2)', fontFamily: 'monospace', fontSize: '11px' }}>
                  <pre>
{`npm install @fintech/smart-schema

const relevance = calculateRelevance(
  userQuery,
  schemaGraph,
  queryHistory
);`}
                  </pre>
                </Box>
              </Box>
            </Grid>
          </Card>
        </Tabs.Content>

        {/* Product Roadmap Tab */}
        <Tabs.Content value="roadmap">
          <Card size="3">
            <Heading size="5" mb="4">Product Roadmap 2025</Heading>
            <Box>
              {roadmapItems.map((item, idx) => (
                <Box key={idx} mb="4">
                  <Flex justify="between" align="center" mb="2">
                    <Flex align="center" gap="3">
                      <Badge 
                        size="2" 
                        color={
                          item.status === 'completed' ? 'green' : 
                          item.status === 'in-progress' ? 'blue' : 'gray'
                        }
                      >
                        {item.quarter}
                      </Badge>
                      <Heading size="4">{item.title}</Heading>
                    </Flex>
                    <Text size="2" color="gray">
                      {item.status === 'completed' ? 'Completed' :
                       item.status === 'in-progress' ? 'In Progress' : 'Planned'}
                    </Text>
                  </Flex>
                  <Grid columns={{ initial: '1', md: '3' }} gap="2" style={{ marginLeft: '60px' }}>
                    {item.features.map((feature, fidx) => (
                      <Flex key={fidx} align="center" gap="2">
                        <Box 
                          style={{ 
                            width: '8px', 
                            height: '8px', 
                            borderRadius: '50%',
                            backgroundColor: item.status === 'completed' ? 'var(--green-9)' : 'var(--gray-7)'
                          }} 
                        />
                        <Text size="2">{feature}</Text>
                      </Flex>
                    ))}
                  </Grid>
                </Box>
              ))}
            </Box>
          </Card>

          {/* Future Vision */}
          <Grid columns={{ initial: '1', md: '2' }} gap="6" mt="6">
            <Card>
              <Heading size="5" mb="4">2026 Vision</Heading>
              <Flex direction="column" gap="3">
                <Flex align="center" gap="2">
                  <Target size={20} color="var(--ruby-9)" />
                  <Text size="3">$18M ARR with 15,000 active users</Text>
                </Flex>
                <Flex align="center" gap="2">
                  <Target size={20} color="var(--ruby-9)" />
                  <Text size="3">Multi-language support (10+ languages)</Text>
                </Flex>
                <Flex align="center" gap="2">
                  <Target size={20} color="var(--ruby-9)" />
                  <Text size="3">Industry-specific AI models</Text>
                </Flex>
                <Flex align="center" gap="2">
                  <Target size={20} color="var(--ruby-9)" />
                  <Text size="3">Autonomous trading insights</Text>
                </Flex>
              </Flex>
            </Card>

            <Card>
              <Heading size="5" mb="4">Market Expansion</Heading>
              <Box>
                <Progress value={100} max={100} color="green" mb="2" />
                <Text size="2" mb="3">US Equity Trading (Current)</Text>
                
                <Progress value={30} max={100} color="blue" mb="2" />
                <Text size="2" mb="3">European Markets (Q2 2025)</Text>
                
                <Progress value={0} max={100} color="gray" mb="2" />
                <Text size="2" mb="3">Asian Markets (Q3 2025)</Text>
                
                <Progress value={0} max={100} color="gray" mb="2" />
                <Text size="2">Crypto & Digital Assets (2026)</Text>
              </Box>
            </Card>
          </Grid>
        </Tabs.Content>

        {/* Business Impact Tab */}
        <Tabs.Content value="impact">
          <Grid columns={{ initial: '1', md: '2' }} gap="6">
            {/* ROI Calculator */}
            <Card size="3">
              <Heading size="5" mb="4">ROI Analysis</Heading>
              <Table.Root>
                <Table.Body>
                  <Table.Row>
                    <Table.Cell>Time saved per trader</Table.Cell>
                    <Table.Cell align="right"><Text weight="bold">2.3 hours/day</Text></Table.Cell>
                  </Table.Row>
                  <Table.Row>
                    <Table.Cell>Value of time saved</Table.Cell>
                    <Table.Cell align="right"><Text weight="bold">$250/hour</Text></Table.Cell>
                  </Table.Row>
                  <Table.Row>
                    <Table.Cell>Annual value per trader</Table.Cell>
                    <Table.Cell align="right"><Text weight="bold">$143,750</Text></Table.Cell>
                  </Table.Row>
                  <Table.Row>
                    <Table.Cell>Platform cost per trader</Table.Cell>
                    <Table.Cell align="right"><Text weight="bold">$1,188/year</Text></Table.Cell>
                  </Table.Row>
                  <Table.Row>
                    <Table.Cell><Text weight="bold">ROI</Text></Table.Cell>
                    <Table.Cell align="right">
                      <Text size="5" weight="bold" color="green">121x</Text>
                    </Table.Cell>
                  </Table.Row>
                </Table.Body>
              </Table.Root>
            </Card>

            {/* Skills Radar */}
            <Card size="3">
              <Heading size="5" mb="4">Product Management Skills</Heading>
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart data={skillsData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="skill" />
                  <PolarRadiusAxis angle={90} domain={[0, 100]} />
                  <Radar
                    name="Skill Level"
                    dataKey="level"
                    stroke="#667eea"
                    fill="#667eea"
                    fillOpacity={0.6}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </Card>
          </Grid>

          {/* Awards & Recognition */}
          <Card size="3" mt="6">
            <Heading size="5" mb="4">
              <Award className="inline mr-2" size={20} />
              Recognition & Achievements
            </Heading>
            <Grid columns={{ initial: '1', md: '2', lg: '4' }} gap="4">
              <Flex direction="column" align="center" gap="2">
                <Box style={{ 
                  padding: '20px', 
                  borderRadius: 'var(--radius-3)',
                  backgroundColor: 'var(--amber-3)'
                }}>
                  <Star size={32} color="var(--amber-9)" />
                </Box>
                <Text size="2" weight="bold">Product Hunt</Text>
                <Text size="1" color="gray">#2 Product of the Day</Text>
              </Flex>
              
              <Flex direction="column" align="center" gap="2">
                <Box style={{ 
                  padding: '20px', 
                  borderRadius: 'var(--radius-3)',
                  backgroundColor: 'var(--blue-3)'
                }}>
                  <Award size={32} color="var(--blue-9)" />
                </Box>
                <Text size="2" weight="bold">TechCrunch</Text>
                <Text size="1" color="gray">Featured AI Innovation</Text>
              </Flex>
              
              <Flex direction="column" align="center" gap="2">
                <Box style={{ 
                  padding: '20px', 
                  borderRadius: 'var(--radius-3)',
                  backgroundColor: 'var(--green-3)'
                }}>
                  <TrendingUp size={32} color="var(--green-9)" />
                </Box>
                <Text size="2" weight="bold">92% Retention</Text>
                <Text size="1" color="gray">After 6 months</Text>
              </Flex>
              
              <Flex direction="column" align="center" gap="2">
                <Box style={{ 
                  padding: '20px', 
                  borderRadius: 'var(--radius-3)',
                  backgroundColor: 'var(--purple-3)'
                }}>
                  <Users size={32} color="var(--purple-9)" />
                </Box>
                <Text size="2" weight="bold">NPS 72</Text>
                <Text size="1" color="gray">Excellent Score</Text>
              </Flex>
            </Grid>
          </Card>

          {/* Call to Action */}
          <Callout.Root mt="6" size="3" color="blue">
            <Callout.Icon>
              <Rocket />
            </Callout.Icon>
            <Callout.Text>
              <Heading size="4" mb="2">Let's Connect!</Heading>
              <Text size="3">
                I'm passionate about building AI products that solve real business problems. 
                If you're looking for a product leader who combines technical depth with business acumen, 
                let's discuss how I can help drive your next AI initiative.
              </Text>
              <Flex gap="3" mt="3">
                <Button size="2" variant="solid">
                  View LinkedIn Profile
                </Button>
                <Button size="2" variant="soft">
                  Download Case Study PDF
                </Button>
              </Flex>
            </Callout.Text>
          </Callout.Root>
        </Tabs.Content>
      </Tabs.Root>
    </Box>
  );
};