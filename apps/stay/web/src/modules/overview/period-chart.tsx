import { Chart } from '@itclabs/react-ui/chart';
import type { ComponentProps } from 'react';

/** Loaded on demand: the chart library is the heaviest part of the landing page. */
export default function PeriodChart(props: ComponentProps<typeof Chart>) {
  return <Chart {...props} />;
}
