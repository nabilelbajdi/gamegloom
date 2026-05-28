import { Helmet } from "react-helmet-async";

const DEFAULT_DESCRIPTION =
  "GameGloom is your personal gaming sanctuary. Discover new games, track your library, write reviews, and share lists with friends.";
const DEFAULT_IMAGE = "https://gamegloom.com/images/collage.jpg";
const SITE_NAME = "GameGloom";

const PageMeta = ({ title, description, image, url }) => {
  const fullTitle = title ? `${title} - ${SITE_NAME}` : `${SITE_NAME}: Discover, Track & Share Games`;
  const metaDescription = description || DEFAULT_DESCRIPTION;
  const metaImage = image || DEFAULT_IMAGE;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={metaDescription} />

      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={metaDescription} />
      <meta property="og:image" content={metaImage} />
      {url && <meta property="og:url" content={url} />}

      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={metaDescription} />
      <meta name="twitter:image" content={metaImage} />
    </Helmet>
  );
};

export default PageMeta;
