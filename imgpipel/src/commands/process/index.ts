import {Args, Command, Flags} from '@oclif/core'
import {stripIndents} from 'common-tags'

import {processMany} from '../../lib/process.js'
import {Target, parseTarget} from '../../types/target.js'

const description = 'Process large images using an asset pipeline to optimize them for web delivery.'

const args = {
  targets: Args.string({
    description: stripIndents`
				Image generation target specifications, in the format \`name:quality:maxWidth:maxHeight\`, e.g. \`large:1.0:1920:1080\`.
				Values other than \`name\` can be omitted, e.g. \`thumb::100:100\`, \`full:1.0::\`',
			`,
    required: true,
  }),
}

const flags = {
  'chroma-subsampling': Flags.string({
    char: 'c',
    default: '420',
    description: 'Jpegli chroma subsampling',
    options: ['420', '422', '440', '444'],
  }),
  'delete-unknown': Flags.boolean({
    description:
      'Delete files in the output directory that would not have been created by this run. DESTRUCTIVE: use with caution!',
  }),
  'in-dir': Flags.string({
    char: 'i',
    description: 'Input directory containing files',
    required: true,
  }),
  'no-table': Flags.boolean({
    description: 'Do not print the results table after processing',
  }),
  'out-dir': Flags.string({
    char: 'o',
    description: 'Output directory to write processed files',
    required: true,
  }),
  'out-metadata': Flags.string({
    char: 'm',
    description: 'Gather camera metadata from all files and write it into a report in this JSON file',
  }),
  'preserve-metadata': Flags.boolean({
    description:
      'By default, metadata is stripped from output images to protect your privacy when publishing online. Use this flag to preserve metadata.',
  }),
  progressive: Flags.string({
    char: 'p',
    default: '2',
    description: 'Jpegli progressive level setting. 0 = sequential, higher value = more scans.',
    options: ['0', '1', '2'],
  }),
  quality: Flags.string({
    char: 'q',
    default: '1.0',
    description:
      'Jpegli max butteraugli distance. Lower value = higher quality, defaults to visually lossless. If a target does not provide quality, this is used as the default.',
  }),
  'reprocess-existing': Flags.boolean({
    description:
      'By default, we skip processing files if an output file exists with the same name. Set this flag to reprocess and overwrite existing files in the output directory. ',
  }),
}

const examples = [
  stripIndents`
    Create thumbnail images from images in ~/input and save them to ~/output:
    <%= config.bin %> <%= command.id %> -i ~/input -o ~/output thumb::200:200
  `,
  stripIndents`
    Create thumbnail, medium, and large images at varying levels of quality, and generate a JSON metadata file:
    <%= config.bin %> <%= command.id %> -i ~/input -o ~/output -m ~/output/metadata.json thumb:2.0:200:200 medium::800:800 large:0.0:1600:1600
  `,
]

export default class Process extends Command {
  static args = args
  static description = description
  static examples = examples
  static flags = flags
  static strict = false

  async run(): Promise<void> {
    const {argv, flags} = await this.parse(Process)
    const defaultQuality = Number.parseFloat(flags.quality)
    const rawTargets = (argv as string[]).map((raw) => parseTarget(raw, defaultQuality))

    const targets: Target[] = []
    const errors: string[] = []
    for (const [index, result] of rawTargets.entries()) {
      if (result.success) targets[index] = result.target
      else errors.push(result.error)
    }

    if (errors.length > 0) this.error(errors.join('\n'))

    await processMany(
      {
        chromaSubsampling: flags['chroma-subsampling'],
        files: {
          deleteUnknown: flags['delete-unknown'],
          reprocessExisting: flags['reprocess-existing'],
        },
        inDir: flags['in-dir'],
        noTable: flags['no-table'],
        outDir: flags['out-dir'],
        outMetadata: flags['out-metadata'],
        preserveMetadata: flags['preserve-metadata'],
        progressive: flags.progressive,
      },
      targets,
    )
  }
}
