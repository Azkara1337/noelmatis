/** Site 100 % statique : `npm run build` produit le dossier `out/`. Vercel le construit et le publie tout seul à chaque push sur GitHub. */
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  images: { unoptimized: true },
};
export default nextConfig;
