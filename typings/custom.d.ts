declare module "worker-loader!*" {
  const content: any;
  export = content;
}

declare module "colormap" {
  interface Options {
    colormap?: string,
    nshades?: number,
    format?: string,
    alpha?: number,
  }
  function colormap (options?: Options): Array<any>;
  export default colormap;
}

declare module "ndarray-fill" {
  function fill (array: any, func: any): any
  export default fill;
}

declare module "ndarray-ops" {
  const content: any;
  export = content;
}

declare module "simplex-noise" {
  const content: any;
  export = content;
}

declare module "alea" {
  const content: any;
  export = content;
}
