import React, { useMemo } from 'react';
import { Box, Card, Heading, Text, Select, Flex, Badge } from '@radix-ui/themes';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Treemap
} from 'recharts';

interface QueryResultChartsProps {
  data: any[];
  queryType?: string;
}

const COLORS = ['#E73C7E', '#23A6D5', '#23D5AB', '#FFA726', '#AB47BC', '#66BB6A', '#29B6F6', '#EF5350'];

export const QueryResultCharts: React.FC<QueryResultChartsProps> = ({ data }) => {
  const [chartType, setChartType] = React.useState('auto');
  
  // Calculate responsive font sizes based on container width
  const [fontSize, setFontSize] = React.useState({
    axis: 12,
    label: 14,
    legend: 12,
    tooltip: 13
  });

  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const updateFontSizes = () => {
      if (containerRef.current) {
        const width = containerRef.current.offsetWidth;
        const vw = window.innerWidth;
        
        // Combine container width and viewport width for better scaling
        const containerScale = Math.min(Math.max(width / 800, 0.6), 1.4);
        const viewportScale = Math.min(Math.max(vw / 1200, 0.7), 1.2);
        const finalScale = (containerScale + viewportScale) / 2;
        
        setFontSize({
          axis: Math.max(8, Math.round(11 * finalScale)),
          label: Math.max(10, Math.round(13 * finalScale)),
          legend: Math.max(9, Math.round(11 * finalScale)),
          tooltip: Math.max(10, Math.round(12 * finalScale))
        });
      }
    };

    // Initial update with a small delay to ensure container is rendered
    const timeoutId = setTimeout(updateFontSizes, 100);
    
    window.addEventListener('resize', updateFontSizes);
    const observer = new ResizeObserver(updateFontSizes);
    if (containerRef.current) {
      observer.observe(containerRef.current);
    }
    
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', updateFontSizes);
      observer.disconnect();
    };
  }, []);

  const { recommendedChart, processedData, chartConfig } = useMemo(() => {
    if (!data || data.length === 0) return { recommendedChart: null, processedData: [], chartConfig: {} };

    const columns = Object.keys(data[0]);
    const numericColumns = columns.filter(col => 
      data.every(row => typeof row[col] === 'number' || !isNaN(parseFloat(row[col])))
    );
    const categoricalColumns = columns.filter(col => !numericColumns.includes(col));

    // Determine recommended chart type based on data structure and query context
    let recommended = 'bar';
    let config: any = {};

    // Check for specific patterns in column names or query
    const hasSecurityType = columns.some(col => col.toLowerCase().includes('security_type') || col.toLowerCase().includes('type'));
    const hasDistribution = columns.some(col => col.toLowerCase().includes('count') || col.toLowerCase().includes('total') || col.toLowerCase().includes('sum'));
    
    if ((hasSecurityType && hasDistribution) || (numericColumns.length === 1 && categoricalColumns.length === 1 && data.length <= 12)) {
      // For security type distribution, use donut chart (pie with inner radius)
      recommended = 'donut';
      config = {
        dataKey: numericColumns[0],
        nameKey: categoricalColumns[0]
      };
    } else if (numericColumns.length >= 2 && categoricalColumns.length === 0) {
      recommended = 'scatter';
      config = {
        xKey: numericColumns[0],
        yKey: numericColumns[1]
      };
    } else if (numericColumns.length === 1 && categoricalColumns.length === 1) {
      if (data.length <= 8) {
        recommended = 'pie';
        config = {
          dataKey: numericColumns[0],
          nameKey: categoricalColumns[0]
        };
      } else {
        recommended = 'bar';
        config = {
          xKey: categoricalColumns[0],
          yKey: numericColumns[0]
        };
      }
    } else if (numericColumns.length > 1 && categoricalColumns.length === 1) {
      recommended = 'line';
      config = {
        xKey: categoricalColumns[0],
        lines: numericColumns
      };
    } else if (data.length > 20 && numericColumns.length >= 1) {
      recommended = 'area';
      config = {
        xKey: columns[0],
        yKey: numericColumns[0]
      };
    }

    // Process data for charts
    const processed = data.map(row => {
      const newRow: any = {};
      columns.forEach(col => {
        newRow[col] = numericColumns.includes(col) ? parseFloat(row[col]) || 0 : row[col];
      });
      return newRow;
    });

    return { recommendedChart: recommended, processedData: processed, chartConfig: config };
  }, [data]);

  const activeChart = chartType === 'auto' ? recommendedChart : chartType;

  const renderChart = () => {
    switch (activeChart) {
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={processedData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--gray-6)" />
              <XAxis 
                dataKey={chartConfig.xKey || Object.keys(processedData[0])[0]} 
                stroke="var(--gray-11)"
                tick={{ fontSize: fontSize.axis }}
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis stroke="var(--gray-11)" tick={{ fontSize: fontSize.axis }} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'var(--gray-2)', 
                  border: '1px solid var(--gray-6)',
                  borderRadius: 'var(--radius-2)',
                  fontSize: fontSize.tooltip
                }}
              />
              <Legend wrapperStyle={{ fontSize: fontSize.legend }} iconSize={fontSize.legend} />
              {chartConfig.yKey ? (
                <Bar dataKey={chartConfig.yKey} fill={COLORS[0]} />
              ) : (
                Object.keys(processedData[0])
                  .filter(key => typeof processedData[0][key] === 'number')
                  .map((key, index) => (
                    <Bar key={key} dataKey={key} fill={COLORS[index % COLORS.length]} />
                  ))
              )}
            </BarChart>
          </ResponsiveContainer>
        );

      case 'line':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={processedData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--gray-6)" />
              <XAxis 
                dataKey={chartConfig.xKey || Object.keys(processedData[0])[0]} 
                stroke="var(--gray-11)"
                tick={{ fontSize: fontSize.axis }}
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis stroke="var(--gray-11)" tick={{ fontSize: fontSize.axis }} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'var(--gray-2)', 
                  border: '1px solid var(--gray-6)',
                  borderRadius: 'var(--radius-2)',
                  fontSize: fontSize.tooltip
                }}
              />
              <Legend wrapperStyle={{ fontSize: fontSize.legend }} iconSize={fontSize.legend} />
              {chartConfig.lines ? (
                chartConfig.lines.map((line: string, index: number) => (
                  <Line 
                    key={line}
                    type="monotone" 
                    dataKey={line} 
                    stroke={COLORS[index % COLORS.length]}
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                ))
              ) : (
                Object.keys(processedData[0])
                  .filter(key => typeof processedData[0][key] === 'number')
                  .map((key, index) => (
                    <Line 
                      key={key}
                      type="monotone" 
                      dataKey={key} 
                      stroke={COLORS[index % COLORS.length]}
                      strokeWidth={2}
                    />
                  ))
              )}
            </LineChart>
          </ResponsiveContainer>
        );

      case 'pie':
        const pieData = processedData.slice(0, 6); // Limit to 6 slices for better label visibility
        const pieTotal = pieData.reduce((sum, entry) => sum + (entry[chartConfig.dataKey] || 0), 0);
        return (
          <ResponsiveContainer width="100%" height={500}>
            <PieChart margin={{ top: 40, right: 80, bottom: 80, left: 80 }}>
              <Pie
                data={pieData}
                dataKey={chartConfig.dataKey || Object.keys(pieData[0]).find(k => typeof pieData[0][k] === 'number')}
                nameKey={chartConfig.nameKey || Object.keys(pieData[0])[0]}
                cx="50%"
                cy="45%"
                outerRadius={130}
                label={(entry) => {
                  const percent = ((entry.value / pieTotal) * 100).toFixed(1);
                  return `${percent}%`;
                }}
                labelLine={false}
              >
                {pieData.map((_entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'var(--gray-2)', 
                  border: '1px solid var(--gray-6)',
                  borderRadius: 'var(--radius-2)',
                  fontSize: fontSize.tooltip,
                  padding: '12px'
                }}
                formatter={(value: any, name: any) => [`${value} (${((value / pieTotal) * 100).toFixed(1)}%)`, name]}
              />
              <Legend 
                verticalAlign="bottom" 
                height={60}
                iconSize={Math.max(fontSize.legend, 8)}
                wrapperStyle={{ 
                  fontSize: Math.max(fontSize.legend, 11),
                  paddingTop: '20px'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        );

      case 'donut':
        const donutData = processedData.slice(0, 8); // Limit to 8 items for better label visibility
        const total = donutData.reduce((sum, entry) => sum + (entry[chartConfig.dataKey] || 0), 0);
        return (
          <ResponsiveContainer width="100%" height={500}>
            <PieChart margin={{ top: 40, right: 80, bottom: 80, left: 80 }}>
              <Pie
                data={donutData}
                dataKey={chartConfig.dataKey || Object.keys(donutData[0]).find(k => typeof donutData[0][k] === 'number')}
                nameKey={chartConfig.nameKey || Object.keys(donutData[0])[0]}
                cx="50%"
                cy="45%"
                innerRadius={60}
                outerRadius={120}
                paddingAngle={3}
                label={(entry) => {
                  const percent = ((entry.value / total) * 100).toFixed(1);
                  return `${percent}%`;
                }}
                labelLine={false}
              >
                {donutData.map((_entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'var(--gray-2)', 
                  border: '1px solid var(--gray-6)',
                  borderRadius: 'var(--radius-2)',
                  fontSize: fontSize.tooltip,
                  padding: '12px'
                }}
                formatter={(value: any, name: any) => [`${value} (${((value / total) * 100).toFixed(1)}%)`, name]}
              />
              <Legend 
                verticalAlign="bottom" 
                height={60}
                iconSize={Math.max(fontSize.legend, 8)}
                wrapperStyle={{ 
                  fontSize: Math.max(fontSize.legend, 11),
                  paddingTop: '20px'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        );

      case 'area':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <AreaChart data={processedData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--gray-6)" />
              <XAxis 
                dataKey={chartConfig.xKey || Object.keys(processedData[0])[0]} 
                stroke="var(--gray-11)"
                tick={{ fontSize: fontSize.axis }}
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis stroke="var(--gray-11)" tick={{ fontSize: fontSize.axis }} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'var(--gray-2)', 
                  border: '1px solid var(--gray-6)',
                  borderRadius: 'var(--radius-2)',
                  fontSize: fontSize.tooltip
                }}
              />
              <Legend wrapperStyle={{ fontSize: fontSize.legend }} iconSize={fontSize.legend} />
              {Object.keys(processedData[0])
                .filter(key => typeof processedData[0][key] === 'number')
                .map((key, index) => (
                  <Area 
                    key={key}
                    type="monotone" 
                    dataKey={key} 
                    stroke={COLORS[index % COLORS.length]}
                    fill={COLORS[index % COLORS.length]}
                    fillOpacity={0.6}
                  />
                ))}
            </AreaChart>
          </ResponsiveContainer>
        );

      case 'treemap':
        if (processedData.length === 0) return null;
        const valueKey = Object.keys(processedData[0]).find(k => typeof processedData[0][k] === 'number');
        return (
          <ResponsiveContainer width="100%" height={400}>
            <Treemap
              data={processedData}
              dataKey={valueKey}
              aspectRatio={4/3}
              stroke="#fff"
              fill={COLORS[0]}
            >
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'var(--gray-2)', 
                  border: '1px solid var(--gray-6)',
                  borderRadius: 'var(--radius-2)',
                  fontSize: fontSize.tooltip
                }}
              />
            </Treemap>
          </ResponsiveContainer>
        );

      default:
        return <Text>No suitable chart type for this data</Text>;
    }
  };

  if (!data || data.length === 0) {
    return null;
  }

  return (
    <Card ref={containerRef}>
      <Flex justify="between" align="center" mb="3">
        <Heading size="4">Data Visualization</Heading>
        <Flex gap="2" align="center">
          <Badge color="gray" variant="soft">
            {processedData.length} data points
          </Badge>
          <Select.Root value={chartType} onValueChange={setChartType}>
            <Select.Trigger />
            <Select.Content>
              <Select.Item value="auto">Auto (Recommended)</Select.Item>
              <Select.Item value="bar">Bar Chart</Select.Item>
              <Select.Item value="line">Line Chart</Select.Item>
              <Select.Item value="pie">Pie Chart</Select.Item>
              <Select.Item value="donut">Donut Chart</Select.Item>
              <Select.Item value="area">Area Chart</Select.Item>
              <Select.Item value="treemap">Treemap</Select.Item>
            </Select.Content>
          </Select.Root>
        </Flex>
      </Flex>
      
      <Box style={{ marginTop: 'var(--space-3)' }}>
        {renderChart()}
      </Box>

      {chartType === 'auto' && (
        <Text size="2" color="gray" mt="3">
          Showing {recommendedChart} chart based on your data structure
        </Text>
      )}
    </Card>
  );
};