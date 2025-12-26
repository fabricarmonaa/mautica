const toRegex = (path) => {
  const keys = [];
  const pattern = path
    .split('/')
    .map((segment) => {
      if (segment.startsWith(':')) {
        keys.push(segment.slice(1));
        return '([^/]+)';
      }
      return segment;
    })
    .join('/');
  return { regex: new RegExp(`^${pattern}$`), keys };
};

export class Router {
  constructor() {
    this.routes = [];
  }

  register(method, path, handler, options = {}) {
    const { regex, keys } = toRegex(path);
    this.routes.push({ method, path, regex, keys, handler, options });
  }

  match(method, url) {
    for (const route of this.routes) {
      if (route.method !== method) {
        continue;
      }
      const match = url.match(route.regex);
      if (match) {
        const params = {};
        route.keys.forEach((key, index) => {
          params[key] = match[index + 1];
        });
        return { route, params };
      }
    }
    return null;
  }
}
