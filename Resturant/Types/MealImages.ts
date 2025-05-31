

const commonImageRoute = "@/assets/images/";
export default {
  // Keys should match your file names (no spaces, exact casing)
  OnionRings: require(`${commonImageRoute}OnionRings.jpg`),
  Tabula:     require(`${commonImageRoute}Tabula.jpg`),
  PotatoWedges:      require(`${commonImageRoute}PotatoWedges.jpg`),
  Lobster:      require(`${commonImageRoute}Lobster.jpg`),
} as {[key: string]: number};
