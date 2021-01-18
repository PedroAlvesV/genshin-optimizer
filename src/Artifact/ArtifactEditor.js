import { faQuestionCircle } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React from 'react';
import { Alert, Badge, Button, Card, Col, Dropdown, DropdownButton, FormControl, InputGroup, OverlayTrigger, Popover, Row } from 'react-bootstrap';
import { FloatFormControl, IntFormControl } from '../Components/CustomFormControl';
import { Stars } from '../Components/StarDisplay';
import Stat from '../Stat';
import { deepClone, getArrLastElement, getRandomElementFromArray, getRandomIntInclusive } from '../Util/Util';
import Artifact from './Artifact';
import ArtifactDatabase from './ArtifactDatabase';
import PercentBadge from './PercentBadge';
import UploadDisplay from './UploadDisplay';

export default class ArtifactEditor extends React.Component {
  constructor(props) {
    super(props);
    this.state = ArtifactEditor.getInitialState()
  }
  static initialState = {
    setKey: "",
    numStars: 0,
    level: 0,
    slotKey: "",//one of flower, plume, sands, globlet, circlet
    mainStatKey: "",
    substats: [{ key: "", value: 0 }, { key: "", value: 0 }, { key: "", value: 0 }, { key: "", value: 0 }],//{key:"",value:_}
  }
  static getInitialState = () => deepClone(ArtifactEditor.initialState)
  setLevel = (newlevel) => this.setState(state => {
    newlevel = parseInt(newlevel)
    if (isNaN(newlevel)) newlevel = 0
    if (newlevel < 0) newlevel = 0;
    if (newlevel > state.numStars * 4) newlevel = state.numStars * 4;
    return { level: newlevel }
  })

  getRemainingSubstats = () =>
    Artifact.getSubStatKeys().filter(key => {
      //if mainstat has key, not valid
      if (this.state.mainStatKey === key) return false;
      //if any one of the substat has, not valid.
      return !this.state.substats.some(substat => substat?.key === key)
    });
  saveArtifact = () => {
    this.uploadDisplayReset()
    let saveArtifact = deepClone(this.state)
    if (saveArtifact.artifactToEdit)
      delete saveArtifact.artifactToEdit;
    this.props.addArtifact?.(saveArtifact)
    this.setState(ArtifactEditor.getInitialState());
  }
  setSetKey = (setKey) => this.setState(state => {
    let numStars = getArrLastElement(Artifact.getRarityArr(setKey))
    let level = (!state.level || state.level > numStars * 4) ? numStars * 4 : state.level
    return { setKey, numStars, level }
  })
  setSubStat = (index, key = "", value = 0) => this.setState(state => {
    if (index >= 4) return
    let substats = state.substats
    substats[index].key = key
    substats[index].value = value
    return { substats }
  })

  setMainStatKey = (mainStatKey) => this.setState(state => {
    state.substats.forEach((substat, index) =>
      substat.key && substat.key === mainStatKey && this.setSubStat(index))
    return { mainStatKey }
  })

  setSlotKey = (slotKey) => this.setState(state => {
    //find a mainstat that isnt taken,
    let mainstats = Artifact.getSlotMainStatKeys(slotKey);
    for (const mainStatKey of mainstats)
      if (!state.substats.some(substat => (substat && substat.key ? (substat.key === mainStatKey) : false)))
        return { slotKey, mainStatKey }
    //if not, then remove one of the substat.
    let mainStatKey = mainstats[0]
    this.setMainStatKey(mainStatKey)
    return { slotKey }
  })

  ArtifactDropDown = (props) => {
    let dropdownitemsForStar = (star) =>
      Artifact.getSetsByMaxStarEntries(star).map(([key, setobj]) =>
      (<Dropdown.Item key={key}
        onClick={() => this.setSetKey(key)}
      >
        {setobj.name}
      </Dropdown.Item >))

    return (<Dropdown as={InputGroup.Prepend} className="flex-grow-1">
      <Dropdown.Toggle className="w-100">
        {Artifact.getSetName(this.state.setKey, "Artifact Set")}
      </Dropdown.Toggle>
      <Dropdown.Menu>
        <Dropdown.ItemText>Max Rarity <Stars stars={5} /></Dropdown.ItemText>
        {dropdownitemsForStar(5)}
        <Dropdown.Divider />
        <Dropdown.ItemText>Max Rarity <Stars stars={4} /></Dropdown.ItemText>
        {dropdownitemsForStar(4)}
        <Dropdown.Divider />
        <Dropdown.ItemText>Max Rarity <Stars stars={3} /></Dropdown.ItemText>
        {dropdownitemsForStar(3)}
      </Dropdown.Menu>
    </Dropdown>)
  }
  MainSelection = (props) =>
    <Row>
      <Col xs={12} lg={6} className="mb-2">
        <InputGroup className="w-100 d-flex">
          {/* Don't know why I can't do <this.ArtifactDropDown />, it has error in production: Element type is invalid: expected a string (for built-in components) or a class/function (for composite components) but got: undefined. */}
          {this.ArtifactDropDown()}
          <DropdownButton as={InputGroup.Append} title={this.state.numStars > 0 ? "🟊".repeat(this.state.numStars) : "Rarity"} disabled={!this.state.setKey}>
            {Artifact.getStars().map((star, index) => {
              star = parseInt(star);
              return <Dropdown.Item key={index} disabled={!Artifact.getRarityArr(this.state.setKey).includes(star)} onClick={() => this.setState({ numStars: star, level: 0 })}>
                {<Stars stars={star} />}
              </Dropdown.Item>
            })}
          </DropdownButton>
        </InputGroup>
      </Col>
      <Col xs={12} lg={6} className="mb-2">
        <InputGroup>
          <InputGroup.Prepend>
            <InputGroup.Text>Level</InputGroup.Text>
          </InputGroup.Prepend>
          <FormControl
            value={this.state.level}
            disabled={!this.state.setKey}
            placeholder={`0~${this.state.numStars * 4}`}
            onChange={(e => this.setLevel(e.target.value))}
          />
          <InputGroup.Append>
            <Button onClick={() => this.setLevel(0)} disabled={!this.state.setKey || this.state.level === 0}>0</Button>
            <Button onClick={() => this.setLevel(this.state.level - 1)} disabled={!this.state.setKey || this.state.level === 0}>-</Button>
            <Button onClick={() => this.setLevel(this.state.level + 1)} disabled={!this.state.setKey || this.state.level === (this.state.numStars * 4)}>+</Button>
            <Button onClick={() => this.setLevel(this.state.numStars * 4)} disabled={!this.state.setKey || this.state.level === (this.state.numStars * 4)}>{this.state.numStars * 4}</Button>
          </InputGroup.Append>
        </InputGroup>
      </Col>
    </Row>
  MainStatInputRow = () =>
    <Row>
      <Col xs={12} lg={6} className="mb-2">
        <InputGroup>
          <DropdownButton
            title={Artifact.getSlotNameWithIcon(this.state.slotKey, "Slot")}
            disabled={!this.state.setKey}
            as={InputGroup.Prepend}
          >
            {Object.keys(Artifact.getPieces(this.state.setKey)).map(slotKey =>
              <Dropdown.Item key={slotKey} onClick={() => this.setSlotKey(slotKey)} >
                {Artifact.getSlotNameWithIcon(slotKey, "Slot")}
              </Dropdown.Item>)}
          </DropdownButton>
          <FormControl
            value={Artifact.getPieceName(this.state.setKey, this.state.slotKey, "Unknown Piece Name")}
            disabled
            readOnly
          />
        </InputGroup>
      </Col>
      <Col xs={12} lg={6} className="mb-2">
        <InputGroup>
          <DropdownButton
            title={Stat.getStatNameWithPercent(this.state.mainStatKey, "Main Stat")}
            disabled={!this.state.setKey || !this.state.slotKey}
            as={InputGroup.Prepend}
          >
            <Dropdown.ItemText>Select a Main Artifact Stat </Dropdown.ItemText>
            {Artifact.getSlotMainStatKeys(this.state.slotKey).map((mainStatKey) =>
              <Dropdown.Item key={mainStatKey} onClick={() => this.setMainStatKey(mainStatKey)} >
                {Stat.getStatNameWithPercent(mainStatKey)}
              </Dropdown.Item>)}
          </DropdownButton>
          <FormControl
            value={this.state.mainStatKey ? `${Artifact.getMainStatValue(this.state.mainStatKey, this.state.numStars, this.state.level)}${Stat.getStatUnit(this.state.mainStatKey)}` : "Main Stat"}
            disabled
            readOnly
          />
        </InputGroup>
      </Col>
    </Row>

  SubStatInput = (props) => {
    let { subStatValidation, numStars, subStatKey } = props
    let percentStat = props.subStatKey && Stat.getStatUnit(props.subStatKey) === "%";
    let substatprops = {
      placeholder: "Select a Substat.",
      value: props.substatevalue ? props.substatevalue : "",
      onValueChange: (val) => this.onSubstatValueChange(val, props.index),
      disabled: !props.subStatKey
    }
    let subStatFormControl = percentStat ?
      <FloatFormControl {...substatprops} />
      : <IntFormControl {...substatprops} />
    let rollData = Artifact.getSubstatRollData(subStatKey, numStars)
    let rolls = subStatValidation?.rolls || []
    let rollNum = rolls?.length || 0
    let rollBadge = <Badge variant={rollNum === 0 ? "secondary" : `${rollNum}roll`} className="text-darkcontent">
      {rollNum ? rollNum : "No"} Roll{(rollNum > 1 || rollNum === 0) && "s"}
    </Badge>
    let rollArr = rolls.map((val, i) => {
      let ind = rollData.indexOf(val)
      let displayNum = 6 - (rollData.length - ind - 1)
      return <span key={i} className={`mr-2 text-${displayNum}roll`}>{val}</span>
    })
    let rollDataDisplay = rollData.length ? <span className="float-right"><small>Possible Rolls:</small> {rollData.map((v, i, arr) => {
      let displayNum = 6 - (arr.length - i - 1)
      return <span key={i} className={`text-${displayNum}roll mr-1`}>{v}</span>
    })}</span> : null
    return <Card bg="lightcontent" text="lightfont">
      <InputGroup>
        <DropdownButton
          title={Stat.getStatName(props.subStatKey, `Substat ${props.index + 1}`)}
          disabled={!props.remainingSubstats || props.remainingSubstats.length === 0}
          as={InputGroup.Prepend}
        >
          {props.remainingSubstats ? props.remainingSubstats.map((key) =>
            <Dropdown.Item key={key} onClick={() => this.onSubStatSelected(key, props.index)} >
              {Stat.getStatNameWithPercent(key)}
            </Dropdown.Item>
          ) : <Dropdown.Item />}
        </DropdownButton>
        {subStatFormControl}
        <InputGroup.Append>
          {percentStat && <InputGroup.Text>%</InputGroup.Text>}
          <InputGroup.Text>
            <PercentBadge
              valid={subStatValidation.valid || !props.subStatKey}
              percent={subStatValidation.efficiency}>
              {props.subStatKey ? (subStatValidation.valid ? `${(subStatValidation.efficiency ? subStatValidation.efficiency : 0).toFixed(2)}%` : "ERR") : "No Stat"}
            </PercentBadge>
          </InputGroup.Text>
        </InputGroup.Append>
      </InputGroup>
      {subStatValidation.valid ? <label className="w-100 mb-0 p-1">{rollBadge} {rollArr}{rollDataDisplay}</label> :
        <label className="w-100 mb-0 p-1"><Badge variant="danger">ERR</Badge> {subStatValidation.msg}</label>}
    </Card>
  }
  onSubStatSelected = (key, index) => {
    this.setState((state) => {
      let substats = JSON.parse(JSON.stringify(state.substats));
      substats[index] = { key: key, value: null }
      return { substats }
    });
  }
  onSubstatValueChange = (newStatValue, index) => {
    this.setState((state) => {
      let substats = state.substats;
      substats[index].value = newStatValue
      return { substats }
    });
  }
  randomizeArtifact = () => {
    let state = ArtifactEditor.getInitialState();
    //randomly choose artifact set
    state.setKey = getRandomElementFromArray(Artifact.getSetKeys());
    //choose star
    state.numStars = getRandomElementFromArray(Artifact.getRarityArr(state.setKey));
    //choose piece
    state.slotKey = getRandomElementFromArray(Object.keys(Artifact.getPieces(state.setKey)));
    //choose mainstat
    state.mainStatKey = getRandomElementFromArray(Artifact.getSlotMainStatKeys(state.slotKey));

    //choose initial substats from star
    let numOfInitialSubStats = getRandomIntInclusive(Artifact.getBaseSubRollNumLow(state.numStars), Artifact.getBaseSubRollNumHigh(state.numStars));

    //choose level
    state.level = getRandomIntInclusive(0, state.numStars * 4)
    let numUpgradesOrUnlocks = Math.floor(state.level / 4);
    let totRolls = numOfInitialSubStats + numUpgradesOrUnlocks
    if (totRolls >= 4) {
      numOfInitialSubStats = 4;
      numUpgradesOrUnlocks = totRolls - 4;
    } else {
      numOfInitialSubStats = totRolls;
      numUpgradesOrUnlocks = 0;
    }
    let RollStat = (subStatKey) =>
      getRandomElementFromArray(Artifact.getSubstatRollData(subStatKey, state.numStars))

    let remainingSubstats = this.getRemainingSubstats()
    //set initial substat & value
    for (let i = 0; i < numOfInitialSubStats; i++) {
      let substat = state.substats[i]
      substat.key = getRandomElementFromArray(remainingSubstats)
      remainingSubstats = remainingSubstats.filter(key => key !== substat.key)
      substat.value = RollStat(substat.key)
    }

    //numUpgradesOrUnlocks should only have upgrades right now. that means all 4 substats have value.
    for (let i = 0; i < numUpgradesOrUnlocks; i++) {
      let substat = getRandomElementFromArray(state.substats)
      substat.value += RollStat(substat.key)
      //make sure there is no rounding numbers
      if (!Number.isInteger(substat.value)) substat.value = parseFloat(substat.value.toFixed(1))

    }
    this.setState(state)
  }
  componentDidUpdate = () => {
    if (this.props.artifactToEdit && this.state.id !== this.props.artifactToEdit.id)
      this.setState(this.props.artifactToEdit)
  }
  render() {
    let remainingSubstats = this.getRemainingSubstats();
    let artifactValidation = Artifact.artifactValidation(this.state)
    let { subStatValidations } = artifactValidation
    return (
      <Card bg="darkcontent" text="lightfont">
        <Card.Header>
          Artifact Editor
        </Card.Header>
        <Card.Body>
          <Row className="mb-2">
            {/* set, rarity, level selection */}
            <Col xs={12}><this.MainSelection /></Col>
            {/* slot, main stat selection */}
            <Col xs={12}><this.MainStatInputRow /></Col>
          </Row>
          {/* artifact efficiency display */}
          <Row>
            <Col>
              <h5 className="mr-auto">Substats</h5>
              <span className="mb-2">
                <span className="mr-3">
                  <span>Current Substat Efficiency </span>
                  <PercentBadge tooltip={artifactValidation.msg} valid={artifactValidation.valid} percent={artifactValidation.currentEfficiency}>
                    {(artifactValidation.currentEfficiency ? artifactValidation.currentEfficiency : 0).toFixed(2) + "%"}
                  </PercentBadge>
                </span>

                <span >
                  <span >Maximum Substat Efficiency </span>
                  <PercentBadge tooltip={artifactValidation.msg} valid={artifactValidation.valid} percent={artifactValidation.maximumEfficiency}>
                    {(artifactValidation.maximumEfficiency ? artifactValidation.maximumEfficiency : 0).toFixed(2) + "%"}
                  </PercentBadge>
                </span>
                <OverlayTrigger
                  placement="bottom"
                  overlay={
                    <Popover >
                      <Popover.Title as="h5">Substat Efficiency</Popover.Title>
                      <Popover.Content>
                        <span>Every 4 artifact upgrades, you get a substat roll. The <strong>substat efficiency</strong> calculates as a percentage how high the substat rolled. The <strong>Maximum Substat Efficiency</strong> of an artifact calculates the efficiency if the remaining upgrades rolled maximum.</span>
                      </Popover.Content>
                    </Popover>
                  }
                >
                  <FontAwesomeIcon icon={faQuestionCircle} className="ml-2" style={{ cursor: "help" }} />
                </OverlayTrigger>
              </span>
            </Col>
          </Row>
          {/* substat selections */}
          <Row className="mb-2">
            {this.state.substats.map((substat, index) =>
              <Col key={"substat" + index} className="mt-1 mb-1" xs={12} lg={6}>
                <this.SubStatInput
                  numStars={this.state.numStars}
                  remainingSubstats={remainingSubstats}
                  subStatKey={substat ? substat.key : null}
                  substatevalue={substat ? substat.value : null}
                  index={index}
                  subStatValidation={subStatValidations[index]}
                />
              </Col>
            )}
          </Row >
          <Row className="mb-2">
            <Col>
              {/* error alert */}
              {artifactValidation.msg ? <Alert variant="danger">{artifactValidation.msg}</Alert> : null}
            </Col>
          </Row>
          <Row>
            {/* Image OCR */}
            <Col xs={12} className="mb-2">
              <UploadDisplay setState={state => this.setState(state)} reset={reset => this.uploadDisplayReset = reset} />
            </Col>
          </Row>
        </Card.Body>
        <Card.Footer>
          <Button className="mr-3" onClick={this.saveArtifact} disabled={ArtifactDatabase.isInvalid(this.state)}>
            {this.props.artifactToEdit ? "Save Artifact" : "Add Artifact"}
          </Button>
          <Button className="mr-3" variant="success"
            onClick={() => {
              this.props.cancelEdit && this.props.cancelEdit();
              this.setState(ArtifactEditor.getInitialState());
            }}
          >
            Clear
          </Button>
          <Button variant="warning"
            onClick={this.randomizeArtifact}
          >
            Randomize
          </Button>
        </Card.Footer>
      </Card>)
  }
}