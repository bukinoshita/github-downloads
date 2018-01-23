#!/usr/bin/env node
'use strict'

const meow = require('meow')
const updateNotifier = require('update-notifier')
const request = require('request-promise-native')
const ora = require('ora')
const shoutSuccess = require('shout-success')
const shoutError = require('shout-error')
const isRepo = require('is-github-repo')
const gitUrlUglify = require('git-url-uglify')
const gitUrlPrettify = require('git-url-prettify')
const { gray } = require('chalk')

const rightPad = require('./lib/right-pad')

const cli = meow(
  `
  Usage:
    $ git-download <owner/repo>     Show download count

  Example:
    $ git-download bukinoshita/taskr

  Options:
    -h, --help                      Show help options
    -v, --version                   Show version
`,
  {
    alias: {
      h: 'help',
      v: 'version'
    }
  }
)

updateNotifier({ pkg: cli.pkg }).notify()

const run = async () => {
  const repo = cli.input[0]
  const { isGithubRepo } = isRepo(repo, { withType: true })

  if (isGithubRepo) {
    const newRepo = gitUrlPrettify(repo)
    const { repository } = gitUrlUglify(newRepo)
    const spinner = ora('Counting downloads...')
    const gitUrl = `https://api.github.com/repos/${repo}/releases`

    spinner.start()

    try {
      const result = await request(gitUrl, {
        headers: { 'User-Agent': 'github-download' }
      })
      const releases = JSON.parse(result)

      let count = 0
      spinner.stop()

      releases.map(release => {
        console.log(`${gray.bold('#' + release.name)}`)
        release.assets.map(({ name, download_count }) => {
          console.log(`- ${rightPad(name, 25)} ${download_count} downloads`)
          count += download_count
        })
        console.log('\n')
      })

      return shoutSuccess(`${repository} has ${count} downloads.`)
    } catch (err) {
      spinner.stop()
      const error = JSON.parse(err.error)
      return shoutError(error.message)
    }
  }

  cli.showHelp()
}

run()
