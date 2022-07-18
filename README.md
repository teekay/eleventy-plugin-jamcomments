# eleventy-plugin-jamcomments

A plugin for integrating the JamComments headless commenting CMS to Eleventy.

## Pre-requisites

Spin up your own instance of the [JamComments API](https://github.com/teekay/JamComments) or sign up for the [hosted version](https://jamcomments.io).

To use this plugin, you will need to store the URL to your JamComments instance (https://example.com/api/comments) and your API key. You will find the latter on your JamComments dashboard. A good way to store these is in a `.env` file.

## Installation

`npm install eleventy-plugin-jamcomments`

### Configuration

Add the following to your Eleventy config file (most likely `.eleventy.js`):

```javascript
const jamcommentsPlugin = require('eleventy-plugin-jamcomments');

module.exports = function(eleventyConfig) {
  eleventyConfig.addPlugin(jamcommentsPlugin, {
    apiUrl: '', // URL to the JamComments API endpoint, ends with '/api/comments'
    apiToken: '', // API key,
    format: '', // 'html' or 'text' or 'markdown' - this controls the level of formatting and sanitization that JamComments will perform before returning your comments. Note that 'html' is safe to use. JamComments returns it sanitized.
    dateFormat: '', // how the timestamp of each comment should be rendered, e.g. 'MMM D, YYYY HH:MM' - see https://momentjs.com/docs/#/displaying/format/ for details
    pathToCache: '/path/to/comments.json', // absolute path on the local filesystem where the downloaded comments will be persisted
    useCached: false, // you can use 'true' in development to avoid needless roundtrips to the JamComments API
    noFollow: false // or true - whether to append ' rel="nofollow"` to the link to a commenter's website
  });
};
```

## Usage

The plugin will hook into the `eleventy.before` event and download all your comments before the build starts. It will place them in a local cache (controlled by the `pathToCache` option).

The easiest way to use the plugin is to use the exported Nunjucks shortcode `commentsForPage`. It will render all comments for a given page as HTML. It will look like this:

```html
<section class="jamcomments comments">
  <article class="comment" data-id="69ac579c-19a1-4b4e-8656-933fd60040ce">
    <p class="comment-meta">
      <span class="post-info-label">${moment(comment.postedAt).format('MMM D, YYYY HH:MM')}
      by <a href="https://example.com">John Doe</a></span>
    </p>
    <blockquote class="comment-text">
      <p>What an awesome article! I really enjoyed reading this! Here are my 2 cents: ...</p>
    </p>
  </article>
  <article>
    ...
  </article>
</section>
```

If you want more granular control over how the comments should be rendered, use the exported functions `commentsForPage` and `commentsRendered` and write your own shortcode.

Once your site builds, all your existing comments will be embedded in the rendered pages, so when a visitor loads the page, there won't be any delay.

You can (and probably should) fetch newer comments with JavaScript. To do that, you will have to write your own front-end code at the moment.

Example (incomplete):

```javascript
async function latestComments() {
  let commentSection = document.querySelector('.comments');
  let comments = Array.from(document.querySelectorAll('.comment'));
  let lastComment = comments[comments.length - 1];
  let lastCommentId = lastComment ? lastComment.getAttribute('data-id') : '';
  let pageUrl = '{{ metadata.url }}{{ page.url }}';
  // TODO this can fail, what then?
  let response = await fetch(`{{ comments.API_URL }}?url=${encodeURIComponent(pageUrl)}&since=${lastCommentId}`, {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer {{ comments.API_TOKEN }}'
    }
  });
  let newComments = await response.json();
  newComments.forEach(c => {
    // render each comment
  });
}
```

## Adding a comment form

You can write your own HTML form for readers to post new comments.

Example:

```html
<form method="POST"
      action="{{ comments.API_URL }}"
      class="comment-form">
  <input type="hidden" name="token" value="{{ comments.API_TOKEN }}"/>
  <input type="hidden" name="postUrl" value="{{ metadata.url }}{{ page.url }}"/>
  <div>
    <textarea name="text" rows="5" style="width: 100%;  margin-bottom: 0.4em;" required></textarea>
  </div>
  <div class="container-flex" style=" margin-bottom: 1.6em;">
    <input type="text" class="field" name="author[name]" placeholder="Your name or nick" required/>
    <input type="email" class="field" name="author[email]" placeholder="Your email (optional)"/>
    <input type="text" class="field" name="author[website]" placeholder="Your website (optional)"/>
  </div>
  <button type="submit" style="float: right;">Post your comment</button>
</form>
```

JamComments API will redirect the commenter back to the page, where your JavaScript will fetch the new comment.

## Feedback

All feedback is very welcome! You can raise bugs, issues, questions, and feature requests in the Issues section.

