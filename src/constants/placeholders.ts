/**
 * Input placeholders that contain `//`.
 *
 * Templates bind these values instead of inlining them. vue-tsc 3.3.14 corrupts `//` in a
 * component attribute value, which breaks type narrowing in the rest of the template and
 * reports false TS2339 errors.
 *
 * @see https://github.com/vuejs/language-tools/issues/6322
 */
export const PLACEHOLDERS = {
  /** Full URL for the URL parser */
  URL_WITH_QUERY: 'https://example.com/path?query=value#hash',
  /** Base URL for the query builder */
  BASE_URL: 'https://example.com/api/endpoint',
  /** Request URL for the cURL builder */
  REQUEST_URL: 'https://api.example.com/endpoint',
  /** Proxy URL for the cURL builder */
  PROXY_URL: 'http://proxy:8080',
  /** XPath expression for the XML query panel */
  XPATH_QUERY: "e.g., //element[@attribute='value']",
} as const
