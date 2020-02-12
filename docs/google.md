# Running koushin with a Google account

## Create an application password

First, you'll need to obtain an application-specific password for koushin from
the [app passwords] page on your Google account.

## Run koushin

Start koushin with these upstream URLs:

    koushin imaps://imap.gmail.com smtps://smtp.gmail.com \
        carddavs://www.googleapis.com/carddav/v1/principals/YOUREMAIL/

Replace `YOUREMAIL` with your Google account's e-mail address.

Once koushin is started, you can login with your e-mail address and the app
password.

[app passwords]: https://security.google.com/settings/security/apppasswords
