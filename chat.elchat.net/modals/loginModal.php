<div class="modal fade dark-modal light-modal" id="loginModal" data-backdrop="static" data-keyboard="false"  tabindex="-1" role="dialog" aria-labelledby="myModalLabel" aria-hidden="true">
  <div class="modal-dialog">
    <div class="modal-content">

      <div class="modal-header">
        <!--<button type="button" class="close" data-dismiss="modal"><span aria-hidden="true">&times;</span><span class="sr-only">Fermer</span></button>-->
        <h4 class="modal-title"><?=$traductions['login'];?></h4>

      </div>
		<form>
			<div class="modal-body">
			<div class="form-group">
				<label for="usernameLogin"><?=$traductions['usernameOrEmail']?></label>
				<input id="usernameLogin" autocomplete="username" maxlength="50" required placeholder="<?=$traductions['enterYourUsernameOrEmail']?>" class="form-control">
		  </div>

		  <div class="form-group">
				<label for="passwordLogin"><?=$traductions['password'];?></label>
				<input id="passwordLogin" autocomplete="password" maxlength="50" required placeholder="<?=$traductions['enterYourPassword']?>" type="password" class="form-control">
		  </div>

		  </div>
		</form>

		<div style="padding-right: 20px;text-align: right;" >
				<input type="checkbox" name="stayConnectedCheckbox" id="stayConnectedCheckbox">
			<label for="stayConnectedCheckbox"><?=$traductions['stayConnected']?></label>
		</div>

      <div class="modal-footer">
      		<button id="forgottenBtn" class="btn pull-left"><?=$traductions['forgottenPassword'];?></button>
		  <?php if ($config->enterChatMode==2):?>
				<button id="enterAsGuestLoginBtn" class="btn btn-info"><span class="glyphicon glyphicon-user"></span> <?=$traductions['enterAsGuest'];?></button>
		  	<?php endif?>

        	<?php if ($config->userCanRegister) : ?>
				<button type="button" id="loginRegisterBtn" class="btn btn-danger"><span class="glyphicon glyphicon-plus-sign"></span> <?=$traductions['register'];?></button>
        	<?php endif ?>

        <button type="button" id="loginBtn" class="btn btn-primary"><span class="fa fa-sign-in"></span> <?=$traductions['login'];?></button>
      </div>

    </div>
  </div>
</div>
<script>
	if (localStorage.getItem('usernameLogin')) {
		$('#usernameLogin').val(localStorage.getItem('usernameLogin'));
		$('#stayConnectedCheckbox').prop('checked', true);
	}
	if (localStorage.getItem('passwordLogin')) {
		$('#passwordLogin').val(localStorage.getItem('passwordLogin'));
	}
</script>