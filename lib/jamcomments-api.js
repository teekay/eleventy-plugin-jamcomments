const fs = require('fs');
const fetch = require('node-fetch');
const moment = require('moment');

/**
 * Reads comments for your website from your JamComments instance and puts them in a JSON cache.
 * 
 * @param {string} apiUrl - Full URL of your JamComments instance, e.g.: https://api.staging.jamcomments.io/api/comments
 * @param {*} apiToken - Your API token
 * @param {*} format - Format of the comments, one of text, html, markdown
 * @param {*} pathToCache - Full path to where the comments cache is or should be located
 * @param {*} useCached - Whether to use the existing cache and skip download, e.g. during local development
 */
async function loadComments(apiUrl, apiToken, format, pathToCache, useCached) {
  if (!apiUrl || !apiToken) {
    throw new Error('JamComments API URL & API token are required to fetch your comments');
  }

  const formats = ['text', 'html', 'markdown'];
  if (!formats.includes(format)) {
    throw new Error(`Unsupported format: ${format}. Use one of ${formats.join(', ')}`)
  }

  try {
    if (fs.existsSync(pathToCache) && useCached) {
      console.log('Using cached comments');
      return;
    }
    console.log(`Fetching all comments for site from ${apiUrl}`);
    const response = await fetch(`${apiUrl}?format=${format}`, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiToken}`
      }
    });
    const body = await response.text();
    const comments = JSON.parse(body); // do this to verify we got a valid JSON
    console.log(`Received ${comments.length} comments`);
    fs.writeFileSync(pathToCache, JSON.stringify(comments));
  } catch (oops) {
    console.warn('Failed to fetch comments :(');
    console.error(oops);
    throw oops;
  }
}

/**
 * Looks up comments for a given page in the local cache.
 * When found, returns them as an array.
 * 
 * @param {string} pathToCache - Full path to where the comments cache is or should be located
 * @param {string} baseUrl - Base URL of your website, e.g. https://example.com
 * @param {string} permalink - Slug of your page, e.g. /blog/five-tips-for-instant-weight-loss
 * @returns {string}
 */
function commentsForPage(pathToCache, baseUrl, permalink) {
  const allComments = require(pathToCache);
  return allComments.filter(c => c.postUrl === `${baseUrl}${permalink}`);
}

/**
 * Returns comments for a page as an HTML block suitable for rendering.
 * 
 * @param {*} comments - an array of comments
 * @param {string} dateFormat - how the datetime of the comment should be formatted (see Moment.format)
 * @param {boolean} noFollow - Whether to append 'rel="nofollow"' to the link to the commenter's website
 * @returns {string}
 */
function commentsRendered(comments, dateFormat, noFollow) {
  const mapped = (comment) => singleComment(comment, dateFormat, noFollow);

  return `<section class="jamcomments comments">
    ${comments.map(mapped).join("\n")}
    </section>`;
}

/**
 * Prints a comment with its metadata to HTML.
 * 
 * @param {*} comment 
 * @param {string} dateFormat - how the datetime of the comment should be formatted (see Moment.format)
 * @param {boolean} noFollow - Whether to append 'rel="nofollow"' to the link to the commenter's website
 * @returns 
 */
function singleComment(comment, dateFormat, noFollow) {
  return `
  <article class="comment" data-id="${comment.id}">
    <p class="comment-meta">
      <span class="post-info-label">${moment(comment.postedAt).format()}
      by ${linkIfPresent(comment.author, noFollow)}</span>
    </p>
    <blockquote class="comment-text">
      ${comment.text}
    </p>
  </article>`;
}

function linkIfPresent(author, noFollow) {
  if (!author.website || author.website.length < 1) {
    return author.name;
  }

  return `<a href="${author.website}" target="_blank"${ noFollow ? ' rel="nofollow"' : '' }>${author.name}</a>`;
}


module.exports = {
  loadComments,
  commentsForPage,
  commentsRendered,
}
