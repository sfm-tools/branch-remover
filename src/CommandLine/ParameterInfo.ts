import { ParameterInfoExample } from './ParameterInfoExample';

export type ParameterInfo = {

  name: string;

  aliases?: Array<string>;

  description: Array<string>;

  examples?: Array<ParameterInfoExample>;

};
