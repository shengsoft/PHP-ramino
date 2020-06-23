$('#formRegister').on('submit', function(e) { // or on button click ?
    e.preventDefault();
    var valid = e.target.checkValidity();
    if (valid) {
        $(this).unbind();
        var email = $('#emailRegister').val();
        var username = $('#username').val();
        var password1 = $('#password1').val();
        var password2 = $('#password2').val();
        if (password1!==password2) {
            bootbox.alert('Error: passwords do not match !');
            return;
        }
        $.post('/ajax.php', {'a':'registerWebmaster', email:email, username:username, password:password1}, function(res) {
            debugger;
            res = JSON.parse(res);
            if (res.result==='ok') {
                bootbox.alert(res.message, function() {
                    window.location = 'https://chat.elchat.net/chatadmin/';
                });
            } else {
                bootbox.alert(res.message);
            }
        });
    }
});
function validateEmail(email) {
    var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(email);
}

$('#resendAgain').click(function() {
    bootbox.prompt('Enter your email, so we can send your data again', function(email) {
        if (!email) {
            return;
        }
        if (!validateEmail(email)) {
            bootbox.alert('Email is incorrect');
            return;
        }
        $.post('/ajax.php', {'a':'resendConfirmation', email:email}, function(res) {
            if (res=='ko') {
                bootbox.alert('Not such email');
            } else {
                bootbox.alert('An email has been sent again to ' + email);
            }
        });


    })
})