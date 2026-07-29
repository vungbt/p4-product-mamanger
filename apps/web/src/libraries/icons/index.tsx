import type { CSSProperties, FC } from 'react';
import Add from './add';
import Briefcase from './briefcase';
import Frame from './frame';
import Graph from './graph';
import Home from './home';
import ReceiptSearch from './receipt-search';

export type IconProps = {
  className?: string;
  style?: CSSProperties;
  transform?: string;
  strokeWidth?: number;
};

export type Icon = FC<IconProps>;

/** Icon dùng cho menu P4 — thêm file mới vào folder này */
export const IconsDefine = {
  graph: 'graph',
  frame: 'frame',
  'receipt-search': 'receipt-search',
  home: 'home',
  briefcase: 'briefcase',
  add: 'add',
} as const;

export type IconName = keyof typeof IconsDefine;

export type IconsType = Record<IconName, Icon>;

export const Icons: IconsType = {
  graph: (props) => <Graph {...props} />,
  frame: (props) => <Frame {...props} />,
  'receipt-search': (props) => <ReceiptSearch {...props} />,
  home: (props) => <Home {...props} />,
  briefcase: (props) => <Briefcase {...props} />,
  add: (props) => <Add {...props} />,
};

export function RenderIcon({ name, ...rest }: IconProps & { name?: IconName }) {
  if (!name) return null;
  const IconComponent = Icons[name];
  return <IconComponent {...rest} style={{ width: 20, height: 20, ...rest.style }} />;
}

export default RenderIcon;
