import { WeaponData } from 'pipeline'
import { IConditionals } from '../../../../Types/IConditional'
import { IWeaponSheet } from '../../../../Types/weapon'
import data_gen from './data_gen.json'
import img from './Weapon_Dragon\'s_Bane.png'

const dmg_s = [20, 24, 28, 32, 36]
const conditionals: IConditionals = {
  bfw: {
    name: "Against Opponents Affected by Hydro/Pyro",
    maxStack: 1,
    stats: stats => ({
      dmg_: dmg_s[stats.weapon.refineIndex]
    })
  }
}
const weapon: IWeaponSheet = {
  ...data_gen as WeaponData,
  img,
  conditionals,
  document: [{
    conditional: conditionals.bfw
  }],
}
export default weapon