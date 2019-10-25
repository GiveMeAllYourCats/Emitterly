<p align="center"><img src="https://i.imgur.com/q2fUNnM.png" /></p>

# Emitterly

[![HitCount](http://hits.dwyl.io/michaeldegroot/emitterly.svg)](http://hits.dwyl.io/michaeldegroot/emitterly)
[![Package quality](https://packagequality.com/shield/emitterly.svg)](https://packagequality.com/#?package=emitterly)
[![Build Status](https://travis-ci.org/michaeldegroot/Emitterly.png?branch=master)](https://travis-ci.org/michaeldegroot/Emitterly)
[![Coverage Status](https://coveralls.io/repos/github/michaeldegroot/Emitterly/badge.svg?branch=master)](https://coveralls.io/github/michaeldegroot/Emitterly?branch=master)
[![Licensing](https://img.shields.io/github/license/michaeldegroot/emitterly.svg)](https://raw.githubusercontent.com/michaeldegroot/Emitterly/master/LICENSE)
[![Repo size](https://img.shields.io/github/repo-size/michaeldegroot/emitterly.svg)](https://github.com/michaeldegroot/Emitterly)
[![Downloads per week](https://img.shields.io/npm/dw/emitterly.svg)](https://www.npmjs.com/package/emitterly)
[![Node version](https://img.shields.io/node/v/emitterly.svg)](https://www.npmjs.com/package/emitterly)
[![Help us and star this project](https://img.shields.io/github/stars/michaeldegroot/emitterly.svg?style=social)](https://github.com/michaeldegroot/Emitterly)

A CLI program to listen to file changes in the filesystem and/or internet and execute certain defined actions on a triggered condition<br>
`Emitterly` Uses grok filters to extract key/pair values from new line events to make your payloads more intelligent. This is explained in detail below.

## Installation

```bash
npm install emitterly --global
```

## Usage

Type `emitterly` or `emitterly -c "path/to/settings.yml"` to run the tool.

`Emitterly` will try to load a `settings.yml` file in the folder you executed the command in

You can run `emitterly` with `DEBUG=emitterly:* emitterly` to view debug messages

#### Command-Line Arguments

| Argument         | Explanation                                   | Default          |
| ---------------- | --------------------------------------------- | ---------------- |
| `-h`             | Shows help                                    |                  |
| `-c <file>`      | Specifies the file path to the settings.yml   | `./settings.yml` |
| `-e <encoding>`  | Sets the encoding of event files              | `utf-8`          |
| `-s <separator>` | Sets the line separator token                 | `/[\r]{0,1}\n/`  |
| `-u`             | Runs eval for conditions instead of safe-eval |                  |
| `-b`             | Reads event files from the beginning          |                  |
| `-f`             | Forces flush of data when EOF is reached.     |                  |
| `-p`             | Prints pretty errors when thrown              |                  |

#### Settings

```yaml
events:
  newlineevent: # This is a event name, you can have multiple events
    file: './test.txt' # The file to watch, you can also use URL's

    # You can have multiple filters
    filters: # Filters are GROK patterns
      # this filter called filter1 will match for example: [12:08:44] 192.168.2.1 (INFO) - User logged in
      filter1: '\[%{TIME:time}\] %{IP:ip} \(%{WORD:type}\) - %{GREEDYDATA:message}'

    # There can be multiple actions
    actions:
      # A webhook action only needs a url to post to, it will post in JSON format
      webhook: 'https://webhook.site/04ed7a87-f9e5-472d-8f66-fc50f83b0a67'

    # The condition for the actions to be triggered in this event, you can use variables from the event class itself
    # For example: '"%match.ip%" == "192.168.2.1"'
    condition: '1 === 1'

    # The payload to send with the actions
    payload:
      ip: '%match.ip%'
      data: 'Emitterly sent a payload! event: %event% condition = %condition% here is a customstring'
```

#### Grok

[grok](https://github.com/elastic/logstash/blob/v1.4.2/patterns/grok-patterns) is a way to match a line against a regular expression and map specific parts of the line into dedicated fields.

For example consider the following new added line to a file that you are monitoring with `Emitterly`:

```
[12:08:44] 192.168.2.1 (INFO) - User logged in
```

You could transform this information to a payload object within `Emitterly` by specifying a grok match pattern in your `settings.yml` file inside the filters of a event:

```yaml
filters:
  filter1: '\[%{TIME:time}\] %{IP:ip} \(%{WORD:type}\) - %{GREEDYDATA:message}'
```

Which will result in the following object:

```js
{
    time: '12:08:44',
    ip: '192.168.2.1',
    type: 'INFO',
    message: 'User logged in'
}
```

You can then use this to send as a payload or to use it in your condition line in `settings.yml`

```yaml
condition: '"%match.ip%" == "192.168.2.1"'
```

So now your payload will only be sent to your action if this condition matches

## License

Copyright (c) 2019 by [GiveMeAllYourCats](https://github.com/michaeldegroot). Some rights reserved.<br>
[Emitterly](https://github.com/michaeldegroot/emitterly) is licensed under the MIT License as stated in the [LICENSE file](https://github.com/michaeldegroot/Emitterly/blob/master/LICENSE).
