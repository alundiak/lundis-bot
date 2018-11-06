// 
// Birthday Dialog Definition
// 
const { ComponentDialog, WaterfallDialog, TextPrompt } = require('botbuilder-dialogs');
const { MemberProfile } = require('./memberProfile');

const NAME_LENGTH_MIN = 3;
const PROFILE_DIALOG = 'profileDialog';
const NAME_PROMPT = 'namePrompt';
const BIRTHDAY_PROMPT = 'birthdayPrompt';

const VALIDATION_SUCCEEDED = true;
const VALIDATION_FAILED = !VALIDATION_SUCCEEDED;

/**
 * Demonstrates the following concepts:
 *  Use a subclass of ComponentDialog to implement a multi-turn conversation
 *  Use a Waterfall dialog to model multi-turn conversation flow
 *  Use custom prompts to validate user input
 *  Store conversation and user state
 *
 * @param {String} dialogId unique identifier for this dialog instance
 * @param {PropertyStateAccessor} memberProfileAccessor property accessor for user state
 */
class BirthdayDialog extends ComponentDialog {
  constructor(dialogId, memberProfileAccessor) {
    super(dialogId);

    if (!dialogId) throw new Error('Missing parameter.  dialogId is required');
    if (!memberProfileAccessor) throw new Error('Missing parameter.  memberProfileAccessor is required');

    // ORDER IMPORTANT
    this.addDialog(new WaterfallDialog(PROFILE_DIALOG, [
      this.initializeStateStep.bind(this),
      this.promptForNameStep.bind(this),
      this.promptForBirthdayStep.bind(this),
      this.displayGreetingStep.bind(this)
    ]));

    this.addDialog(new TextPrompt(NAME_PROMPT, this.validateName));
    this.addDialog(new TextPrompt(BIRTHDAY_PROMPT, this.validateBirthday));

    this.memberProfileAccessor = memberProfileAccessor;
  }

  /**
   * Waterfall Dialog step functions.
   *
   * Initialize our state.  See if the WaterfallDialog has state pass to it
   * If not, then just new up an empty MemberProfile object
   *
   * @param {WaterfallStepContext} step contextual information for the current step being executed
   */
  async initializeStateStep(step) {
    let memberProfile = await this.memberProfileAccessor.get(step.context);
    if (memberProfile === undefined) {
      if (step.options && step.options.memberProfile) {
        await this.memberProfileAccessor.set(step.context, step.options.memberProfile);
      } else {
        await this.memberProfileAccessor.set(step.context, new MemberProfile());
      }
    }
    return await step.next();
  }

  /**
   * Waterfall Dialog step functions.
   *
   * Using a text prompt, prompt the user for their name.
   * Only prompt if we don't have this information already.
   *
   * @param {WaterfallStepContext} step contextual information for the current step being executed
   */
  async promptForNameStep(step) {
    const memberProfile = await this.memberProfileAccessor.get(step.context);
    // if we have everything we need, greet user and return
    if (memberProfile !== undefined && memberProfile.name !== undefined) {
      return await this.greetUser(step);
    }
    if (!memberProfile.name) {
      // prompt for name, if missing
      return await step.prompt(NAME_PROMPT, 'What is your name?');
    } else {
      return await step.next();
    }
  }

  /**
   * Waterfall Dialog step functions.
   *
   * Using a text prompt, prompt the user for the city in which they live.
   * Only prompt if we don't have this information already.
   *
   * @param {WaterfallStepContext} step contextual information for the current step being executed
   */
  async promptForBirthdayStep(step) {
    // save name, if prompted for
    const memberProfile = await this.memberProfileAccessor.get(step.context);
    if (memberProfile.name === undefined && step.result) {
      let lowerCaseName = step.result;
      // capitalize and set name
      memberProfile.name = lowerCaseName.charAt(0).toUpperCase() + lowerCaseName.substr(1);
      await this.memberProfileAccessor.set(step.context, memberProfile);
    }
    if (!memberProfile.birthday) {
      return await step.prompt(BIRTHDAY_PROMPT, `Hello ${memberProfile.name}, when do you have Birthday? (MM/DD)`);
    } else {
      return await step.next();
    }
  }

  /**
   * Waterfall Dialog step functions.
   *
   * Having all the data we need, simply display a summary back to the user.
   *
   * @param {WaterfallStepContext} step contextual information for the current step being executed
   */
  async displayGreetingStep(step) {
    const memberProfile = await this.memberProfileAccessor.get(step.context);
    if (memberProfile.birthday === undefined && step.result) {
      let lowerCaseBirthday = step.result;
      // capitalize and set city
      // memberProfile.city = lowerCaseCity.charAt(0).toUpperCase() + lowerCaseCity.substr(1);
      memberProfile.birthday = lowerCaseBirthday;
      await this.memberProfileAccessor.set(step.context, memberProfile);
    }
    return await this.greetUser(step); // TODO
  }

  /**
   * Validator function to verify that user name meets required constraints.
   *
   * @param {PromptValidatorContext} validation context for this validator.
   */
  async validateName(validatorContext) {
    // Validate that the user entered a minimum length for their name
    const value = (validatorContext.recognized.value || '').trim();
    if (value.length >= NAME_LENGTH_MIN) {
      return VALIDATION_SUCCEEDED;
    } else {
      await validatorContext.context.sendActivity(`Names need to be at least ${NAME_LENGTH_MIN} characters long.`);
      return VALIDATION_FAILED;
    }
  }

  /**
   * Validator function to verify if birthday meets required constraints.
   *
   * @param {PromptValidatorContext} validation context for this validator.
   */
  async validateBirthday(validatorContext) {
    const value = (validatorContext.recognized.value || '').trim();

    // TODO implement Date-related validation
    // if (value is valid date format MM/DD) {
    if (true) {
      return VALIDATION_SUCCEEDED;
    } else {
      await validatorContext.context.sendActivity(`Birthday needs to be valid date format.`);
      return VALIDATION_FAILED;
    }
  }

  /**
   * Helper function to greet user with information in greetingState.
   *
   * @param {WaterfallStepContext} step contextual information for the current step being executed
   */
  async greetUser(step) {
    const memberProfile = await this.memberProfileAccessor.get(step.context);
    // Display to the user their profile information and end dialog
    await step.context.sendActivity(`${memberProfile.name}, on day of your birthday (${memberProfile.birthday}), I will send bot message to chat!`);
    await step.context.sendActivity(`You can always say 'My birthday is <your birthday date> to change birth date in my memory.`);
    return await step.endDialog();
  }
}

exports.BirthdayDialog = BirthdayDialog;
