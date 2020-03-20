const isEmail = (email) => {
    const regEx = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    if (String(email).match(regEx)){
        return true;
    }else {
      return false;
    }  
};
const isEmpty = (string ) => {
    if(string.trim() === '') return true;
    else return false;
};


exports.validateSignUpData = (data) => {
    let errors = {};
    
    if(isEmpty(data.email)){
        errors.email = 'Must not be empty';
    }else if(!isEmail(data.email)){
        errors.email = 'Must be valid email address';
    }

    if(isEmpty(data.password)){
        errors.password = 'Must not be empty';
    } 
    if(data.password !== data.confirmPassword){
        errors.confirmPassword = 'Passwords must match';
    } 
    if(isEmpty(data.handle)){
        errors.handle = 'Must not be empty';
    } 
    return {
        errors,
        valid: Object.keys(errors).length === 0 ? true : false
       }
    }

exports.validateLogInData = (data) => {
    let errors = {};
    //Validation
    if(isEmpty(data.email)){
        errors.email = 'Must not be empty';
    }
    if(isEmpty(data.password)){
        errors.password = 'Must not be empty';
    }
    return {
        errors,
        valid: Object.keys(errors).length === 0 ? true : false
      }
    };

    exports.reduceUserDetails = (data) => {
        let userDetails = {};

        if (!isEmpty(data.bio.trim())) userDetails.bio = data.bio;
        if (!isEmpty(data.location.trim())) userDetails.location = data.location;
        if (!isEmpty(data.phoneNumber.trim())) userDetails.phoneNumber = data.phoneNumber;
        if (!isEmpty(data.jobTitle.trim())) userDetails.jobTitle = data.jobTitle;
        if (!isEmpty(data.company.trim())) userDetails.company = data.company;
        if (!isEmpty(data.school.trim())) userDetails.school = data.school;

        return userDetails;
    }