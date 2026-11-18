import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { test } from 'node:test';

const require = createRequire(import.meta.url);
const { descriptionToHtml } = require('../src/sequelize/rich-text-html.cjs');

const lexical = (children) => JSON.stringify({ root: { type: 'root', children } });
const text = (value, format = 0) => ({ type: 'text', text: value, format });

test('plain text becomes escaped paragraphs with line breaks', () => {
  assert.equal(descriptionToHtml('In logo, dung tích lớn'), '<p>In logo, dung tích lớn</p>');
  assert.equal(
    descriptionToHtml('a <b> & "x"\nline 2\n\npara 2'),
    '<p>a &lt;b&gt; &amp; &quot;x&quot;<br>line 2</p><p>para 2</p>',
  );
});

test('empty values and existing HTML are unchanged', () => {
  assert.equal(descriptionToHtml(''), '');
  assert.equal(descriptionToHtml('   '), '');
  assert.equal(descriptionToHtml('<p>Lorem</p>'), '<p>Lorem</p>');
});

test('Lexical state renders headings, formats, lists, line breaks and safe links', () => {
  const html = descriptionToHtml(
    lexical([
      { type: 'heading', tag: 'h2', children: [text('Title')] },
      {
        type: 'paragraph',
        children: [text('Bold', 1), text(' & '), text('both', 3), { type: 'linebreak' }],
      },
      {
        type: 'list',
        listType: 'number',
        children: [{ type: 'listitem', children: [text('One')] }],
      },
      { type: 'paragraph', children: [] },
      {
        type: 'paragraph',
        children: [
          { type: 'link', url: 'https://example.com/?a=1&b=2', children: [text('ok')] },
          { type: 'link', url: 'javascript:alert(1)', children: [text('bad')] },
        ],
      },
    ]),
  );
  assert.equal(
    html,
    '<h2>Title</h2><p><strong>Bold</strong> &amp; <em><strong>both</strong></em><br></p><ol><li>One</li></ol><p><a href="https://example.com/?a=1&amp;b=2">ok</a>bad</p>',
  );
});

test('pretty-printed state that lost its newline escapes is repaired', () => {
  const broken = JSON.stringify(
    { root: { type: 'root', children: [{ type: 'paragraph', children: [text('Kept')] }] } },
    null,
    2,
  ).replace(/\n/g, 'n');
  assert.equal(descriptionToHtml(broken), '<p>Kept</p>');
});

test('unrepairable editor state keeps its words instead of raw JSON', () => {
  assert.equal(
    descriptionToHtml('{"root": {"children": [{"text": "Alpha"}, {"text": "Beta" BROKEN'),
    '<p>Alpha</p><p>Beta</p>',
  );
});
