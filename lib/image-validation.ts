export async function validateImageUrl(urlStr: string): Promise<{ isValid: boolean; error?: string }> {
  if (!urlStr || typeof urlStr !== 'string') {
    return { isValid: false, error: 'Image URL is empty or not a string.' };
  }

  // 1. Basic URL Structure Check
  let url: URL;
  try {
    url = new URL(urlStr);
  } catch {
    return { isValid: false, error: 'Malformed URL format.' };
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    return { isValid: false, error: 'URL protocol must be HTTP or HTTPS.' };
  }

  // 2. Reject Google Search or Images Redirect / Result pages
  const hostname = url.hostname.toLowerCase();
  if (
    hostname.includes('google.com') ||
    hostname.includes('google.co.in') ||
    hostname.includes('google.net') ||
    hostname.includes('google.org')
  ) {
    const isSearchPage = url.pathname.includes('/search') || 
                         url.pathname.includes('/imgres') || 
                         url.pathname.includes('/url') || 
                         url.pathname.includes('/imglanding');
    if (isSearchPage) {
      return { isValid: false, error: 'Google Search or Google Images result pages are not direct image URLs.' };
    }
  }

  // 3. Connection and Content-Type Verification
  try {
    const headController = new AbortController();
    const headTimeoutId = setTimeout(() => headController.abort(), 6000); // 6-second timeout for HEAD

    let res: Response;
    try {
      res = await fetch(urlStr, {
        method: 'HEAD',
        signal: headController.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
      });
    } catch {
      // If HEAD completely fails or gets rejected, we will let it fall through to the GET request check
      res = new Response(null, { status: 405 });
    } finally {
      clearTimeout(headTimeoutId);
    }

    // If HEAD fails (e.g. 405 Method Not Allowed or 403 Forbidden), some CDNs restrict HEAD. Fall back to GET.
    if (!res.ok) {
      const getController = new AbortController();
      const getTimeoutId = setTimeout(() => getController.abort(), 8000); // 8-second timeout for GET

      const getRes = await fetch(urlStr, {
        method: 'GET',
        signal: getController.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
      });

      clearTimeout(getTimeoutId);

      if (!getRes.ok) {
        return { isValid: false, error: `Remote image server returned status code ${getRes.status}.` };
      }

      const contentType = getRes.headers.get('content-type');
      if (!contentType || !contentType.toLowerCase().startsWith('image/')) {
        return { isValid: false, error: `URL does not point to an image. Content-Type is ${contentType || 'missing'}.` };
      }

      // Read a tiny chunk of body to verify connection is alive, then close it
      if (getRes.body) {
        const reader = getRes.body.getReader();
        await reader.read();
        await reader.cancel();
      }

      return { isValid: true };
    }

    const contentType = res.headers.get('content-type');
    if (!contentType || !contentType.toLowerCase().startsWith('image/')) {
      return { isValid: false, error: `URL does not point to an image. Content-Type is ${contentType || 'missing'}.` };
    }

    return { isValid: true };
  } catch (error: unknown) {
    const isAbort = error instanceof Error && error.name === 'AbortError';
    if (isAbort) {
      return { isValid: false, error: 'Connection timed out trying to reach the image host.' };
    }
    const message = error instanceof Error ? error.message : String(error);
    return { isValid: false, error: `Failed to connect to image host: ${message}` };
  }
}
