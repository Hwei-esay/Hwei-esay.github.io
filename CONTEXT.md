# Context

This repository is a personal knowledge site built with Jekyll and GitHub Pages.

## Domain Vocabulary

### Personal Knowledge Site

The published website. It turns Markdown content and local research tools into a long-lived personal knowledge hub.

### Content Collection

A family of Markdown entries with a shared purpose, URL shape, and layout. Current Content Collections are blog posts, moments, tutorials, skills, and academia notes.

### Section Registry

The data file that names site sections, navigation entries, landing URLs, descriptions, and homepage counts. It is the preferred seam for adding, removing, or renaming visible site sections.

### Collection Landing Page

A top-level page such as `/blog/` or `/tutorials/` that lists entries from a Content Collection.

### External Project Section

A navigation entry that points to another repository or separately deployed GitHub Pages project under the same account. It belongs in the Section Registry, but it does not require a local landing page in this repository.

### Article Shell

The shared visual frame for an individual content entry: title, section label, metadata, optional summary, and prose body.

### Embedded Research Tool

A standalone browser tool shipped under `tools/`, linked from the site, and published with the static site. `tools/phonon/` is the current Embedded Research Tool.

### Build Validation

Lightweight repository checks that verify the Section Registry, collection landing pages, navigation targets, and front matter before deployment.
