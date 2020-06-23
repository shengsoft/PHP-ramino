<?php function translateGender($gender, $traductions) {
    if (isset($traductions[$gender])) {
        return $traductions[$gender];
    } else {
        return $gender;
    }

}?>
<div class="modal fade dark-modal light-modal" id="loginGuestModal"  data-backdrop="static" data-keyboard="false" tabindex="-1" role="dialog" aria-labelledby="myModalLabel" aria-hidden="true">
    <div class="modal-dialog">
        <div class="modal-content">

            <div class="modal-header">
                <!--<button type="button" class="close" data-dismiss="modal"><span aria-hidden="true">&times;</span><span class="sr-only">Fermer</span></button>-->
                <h4 class="modal-title"><?=$traductions['login'];?></h4>

            </div>
            <div class="modal-body">
                <form >
                    <div class="form-group">
                        <label for="usernameGuestLogin"><?=$traductions['chooseAnUsername'];?></label>
                        <input id="usernameGuestLogin" pattern="[a-zA-Z][a-zA-Z0-9_\-\.]*" required maxlength="50" placeholder="<?=$traductions['chooseAnUsername'];?>" class="form-control">
                    </div>
                    <div class="form-group flex-property flex-center">
                        <?php $i=0; ?>
                        <?php foreach($genders as $gender): ?>
                            <div class="radio radio-primary radio-inline">
                                <input type="radio" id="guestLogin<?=$gender->gender?>" value="<?=$gender->gender?>" <?php if(!$i) echo 'checked';?> name="guestLogingender" >
                                <label for="guestLogin<?=$gender->gender?>">
                                    <?php if($gender->image): ?>
                                        <img src="/upload/genders/<?=$gender->image?>"/>
                                    <?php endif?>
                                    <span style="color:<?=$gender->color?>"><?=translateGender($gender->gender, $traductions)?></span>
                                </label>
                            </div>
                            <?php $i++; ?>
                        <?php endforeach; ?>
                    </div>
                </form>
                <?php if ($config->guestConditionsCheckbox): ?>
                    <div>
                        <input type="checkbox" id="acceptConditionsCheckBox">
                        <label for="acceptConditionsCheckBox"><?=$config->guestConditionsCheckbox?></label>

                    </div>
                <?php endif?>

            </div>

            <div class="modal-footer">
                <!--<button type="button" class="btn btn-default" data-dismiss="modal">Fermer</button>-->
                <button type="button" id="loginGuestBtn" class="btn btn-primary"><span class="fa fa-sign-in"></span> <?=$traductions['login'];?></button>
            </div>

        </div>
    </div>
</div>
<script>
    $('#usernameGuestLogin').on('keypress', function(e) {
        var keyCode = e.keyCode || e.which;
        if (keyCode === 13) {
            e.preventDefault();
            e.stopImmediatePropagation;
            $('#loginGuestBtn').click();
        }
    });

    $('#loginGuestBtn').click(function(e) {
        if ($('#acceptConditionsCheckBox').length && !$('#acceptConditionsCheckBox').prop('checked')) {
            bootbox.alert(chatHTML5.traductions.youMustAcceptTermsOfUse)
            return;
        }
        var username = $('#usernameGuestLogin').val();
        var gender = $('input[name=guestLogingender]:checked').val();

        if (chatHTML5.config.enterChatMode=='2' || chatHTML5.config.enterChatMode=='1') {
            $.post(chatHTML5.config.ajax, {a: 'checkUsername', username:username}, function (res) {
                if (res=='ok') {
                    chatHTML5.loginAsGuest(username, gender);
                } else {
                    bootbox.alert(chatHTML5.traductions["Sorry this username is already taken"]);
                }
            });
        } else {
            chatHTML5.loginAsGuest(username, gender);
        }
    });
</script>