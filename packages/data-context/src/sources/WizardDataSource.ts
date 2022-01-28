import { stat } from 'fs-extra'
import resolveFrom from 'resolve-from'
import Debug from 'debug'
import { BUNDLERS, CODE_LANGUAGES, FRONTEND_FRAMEWORKS, PACKAGES_DESCRIPTIONS } from '@packages/types'
import type { NexusGenObjects } from '@packages/graphql/src/gen/nxs.gen'
import type { DataContext } from '..'

const debug = Debug('cypress:data-context:wizard-data-source')

export class WizardDataSource {
  constructor (private ctx: DataContext) {}

  async packagesToInstall (): Promise<Array<NexusGenObjects['WizardNpmPackage']> | null> {
    if (!this.chosenFramework || !this.chosenBundler) {
      return null
    }

    const packages = [
      {
        name: this.chosenFramework.name as string,
        description: PACKAGES_DESCRIPTIONS[this.chosenFramework.package],
        package: this.chosenFramework.package,
      },
      {
        name: this.chosenBundler.name as string,
        description: PACKAGES_DESCRIPTIONS[this.chosenBundler.package],
        package: this.chosenBundler.package as string,
      },
    ]

    const storybookInfo = await this.ctx.storybook.loadStorybookInfo()
    const { storybookDep } = this.chosenFramework

    if (storybookInfo && storybookDep) {
      packages.push({
        name: storybookDep,
        description: PACKAGES_DESCRIPTIONS[storybookDep],
        package: storybookDep,
      })
    }

    return packages
  }

  async resolvePackagesToInstall (): Promise<string[]> {
    const packagesInitial = await this.packagesToInstall() || []

    debug('packages to install: %o', packagesInitial)
    const installedPackages: (string|null)[] = await Promise.all(packagesInitial.map(async (p) => {
      if (this.ctx.currentProject) {
        try {
          debug('package checked: %s', p.package)
          const pkgPath = resolveFrom(this.ctx.currentProject, p.package)

          debug('package path: %s', pkgPath)
          const statFound = await stat(pkgPath)

          debug('package stat: %o', statFound)

          return statFound ? p.package : null
        } catch (e) {
          // nope
        }
      }

      return null
    }))

    return installedPackages.filter((p) => p !== null) as string[]
  }

  get chosenFramework () {
    return FRONTEND_FRAMEWORKS.find((f) => f.type === this.ctx.wizardData.chosenFramework) || null
  }

  get chosenBundler () {
    return BUNDLERS.find((f) => f.type === this.ctx.wizardData.chosenBundler) || null
  }

  get chosenLanguage () {
    return CODE_LANGUAGES.find((f) => f.type === this.ctx.wizardData.chosenLanguage) || null
  }
}
