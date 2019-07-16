import { action, observable } from 'mobx';

class AliceStore {
    stores = null;
    constructor(stores) {
        this.stores = stores;
    }

    @observable fakeHeaders = [0,1,2,3,4,5,6];
    @observable showContactInfoModal = false;
    @observable showGroupInfoModal = false;

    @observable currentStep = 0;
    @observable searchValue = '';
    @observable newGroupMembers = [];
    @observable forwardPreviousMessages = true;
}

export default AliceStore;

