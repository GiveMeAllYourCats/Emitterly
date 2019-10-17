[![Emitterly Logo](https://i.imgur.com/q2fUNnM.png)](https://github.com/michaeldegroot/Emitterly)

[![Package quality](https://packagequality.com/shield/emitterly.svg)](https://packagequality.com/#?package=emitterly)
[![NPM Version](https://img.shields.io/npm/v/emitterly.svg)](https://www.npmjs.com/package/emitterly)
[![Build Status](https://travis-ci.org/michaeldegroot/Emitterly.png?branch=master)](https://travis-ci.org/michaeldegroot/Emitterly)
[![Coverage Status](https://coveralls.io/repos/github/michaeldegroot/Emitterly/badge.svg?branch=master)](https://coveralls.io/github/michaeldegroot/Emitterly?branch=master)
[![Licensing](https://img.shields.io/github/license/michaeldegroot/emitterly.svg)](https://raw.githubusercontent.com/michaeldegroot/Emitterly/master/LICENSE)
[![Commit Activity](https://img.shields.io/github/commit-activity/m/michaeldegroot/Emitterly.svg)](https://github.com/michaeldegroot/Emitterly/pulse/monthly)
[![Last Commit](https://img.shields.io/github/last-commit/michaeldegroot/Emitterly.svg)](https://github.com/michaeldegroot/MonkeySet/commits/master)
[![Repo size](https://img.shields.io/github/repo-size/michaeldegroot/emitterly.svg)](https://github.com/michaeldegroot/Emitterly)
[![Downloads per week](https://img.shields.io/npm/dw/emitterly.svg)](https://www.npmjs.com/package/emitterly)
[![Node version](https://img.shields.io/node/v/emitterly.svg)](https://www.npmjs.com/package/emitterly)
[![Top language of repo](https://img.shields.io/github/languages/top/badges/shields.svg)](https://github.com/michaeldegroot/Emitterly)
[![Help us and star this project](https://img.shields.io/github/stars/michaeldegroot/emitterly.svg?style=social)](https://github.com/michaeldegroot/Emitterly)

# Getting Started

##### Start by installing Emitterly globally

```bash
npm install emitterly --global
```

##### Emitterly works with YAML files to load your prefered settings, start by creating a settings file

```yaml
events:
  # This is a event name
  # It has a file that it watches and grok patterns that
  # Will match the last line that has been observed
  newlineevent:
    # The file to watch
    file: './test.txt'

    # There can be multiple filters
    filters:
      # this filter called filter1 will match: [12:08:44] 192.168.2.1 (INFO) - User logged in
      filter1: '\\[%{TIME:time}\\] %{IP:ip} \\(%{WORD:type}\\) - %{GREEDYDATA:message}'

    # There can be multiple actions
    actions:
      # A webhook action only needs a url to post to, it will post in JSON format
      webhook: 'https://webhook.site/04ed7a87-f9e5-472d-8f66-fc50f83b0a67'

    # The condition for the actions to be triggered in this event, you can use variables from the event class itself
    # For example: '"%match.ip%" == "192.168.2.1"'
    condition: '1 === 1'

    # The payload to send with the actions
    payload:
      data: '%match.ip% %event% %condition% customstring'
```
