import { action, observable } from 'mobx';

class AliceStore {
    stores = null;
    constructor(stores) {
        this.stores = stores;
    }

    @observable fakeHeaders = [0,1,2,3,4,5,6];
    @observable showThreadInfoModal = false;
    @observable showNewThreadMembersModal = false;

    @observable currentStep = 0;
    @observable searchValue = '';
    @observable newThreadMembers = [];
    @observable newThreadName = '';
    @observable forwardPreviousMessages = true;

    @action
    resetNewThreadMember() {
        const { cdms } = this.stores;
        this.currentStep = 0;
        this.searchValue = '';
        this.newThreadMembers = [];
        this.forwardPreviousMessages = true;
        cdms.forwardedList = null;
    }
}

export default AliceStore;

