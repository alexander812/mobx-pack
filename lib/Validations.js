import _ from 'lodash';
import validate from 'validate.js';
import trans from 'trans';

// TODO указывать какие поля не заполнены
/**
 * Custom validators
 */
validate.validators.presence.message = trans('empty_fields');

validate.validators.isTrue = (value) => {
    return value !== true
        ? trans('empty_fields')
        : null;
};

export default class Validations {

    constraints = null;

    /**
     * @param constraints дефолтные правила валидации
     * @param messageCollection ссылка на класс коллекции ошибок
     * @param customValidators дополнительные правила которые должны учитывать контекст
     */
    constructor(constraints, messageCollection, customValidators) {
        this.constraints = constraints;
        this.messageCollection = messageCollection;
        validate.validators = _.merge(validate.validators, customValidators);
    }

    updateConstrains(constraints) {
        const customizer = (objValue, srcValue) => {
            if (!_.isObject(objValue)) {
                return srcValue;
            }
        };

        this.constraints = _.mergeWith(this.constraints, constraints, customizer);
    }

    /**
     * служебный метод, определяет работу с коллекцией сообщений
     * @param result результат полученный от фун-ии валидации
     * @param fields поля по которым обновить данные
     * @private
     */
    _updateMessagesCollection(result, fields) {
        if (!result || _.size(result) === 0) {
            if (fields) {
                this.messageCollection.remove(fields);
            } else {
                this.messageCollection.clear();
            }

            return;
        }

        this.messageCollection.add(result, 'error');
    }

    /**
     * @param currentObj object объект который мы будем валидировать
     * @param fields string|null поля по которым провести валидацию, если не указанно то
     * валидируеться по всем полям
     * @param constrains object описание правил валидации, если не указанно то используються
     * правила указанные при инициализации
     */
    isValid(currentObj, fields, constrains) {
        const workConstrains = constrains ? constrains : this.constraints;
        if (!workConstrains) {
            return;
        }
        const validationResult = validate(currentObj, workConstrains, { fullMessages: false });

        if (!fields) {
            this._updateMessagesCollection(validationResult);
            return !validationResult;
        }

        const pickedResult = _.pick(validationResult, fields.split(','));
        this._updateMessagesCollection(pickedResult, fields);

        return _.size(pickedResult) === 0;
    }

    isValidEasy(currentObj, fields, constrains) {
        const workConstrains = constrains ? constrains : this.constraints;
        if (!workConstrains) {
            return;
        }
        const validationResult = validate(currentObj, workConstrains, { fullMessages: false });

        if (!fields) {
            return !validationResult;
        }

        const pickedResult = _.pick(validationResult, fields.split(','));

        return _.size(pickedResult) === 0;
    }

    /**
     * @param currentObj require
     * @param fields require
     * @param constrains option
     */
    isValidOneField(currentObj, fields, constrains) {
        const workConstrains = constrains ? constrains : this.constraints;
        if (!workConstrains) {
            return;
        }
        const validationResult = validate(
            currentObj,
                _.pick(workConstrains, fields.split(',')),
            { fullMessages: false },
        );

        return !validationResult;
    }
}
