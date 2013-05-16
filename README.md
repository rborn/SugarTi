#####SugarTi adds some sugar to the Titanium CLI syntax.

I'm lazy and the Titanium CLI has too many options I have to type, besides that it doesn't install (yet) the app directly on the iOs device but uses iTunes. So I made this to save some typing and time :)


It's inspired by [clti](https://github.com/iamyellow/clti) and uses a version of [fruitstrap](https://github.com/ghughes/fruitstrap)

#####Features

For now it only builds and runs in the iPhone simulator (no iPad or android) and deploys to an iOs device. See **ToDo**.

The script also tries to find the provisoning profile to use when deploying to device so there is no need to type it yourself.


#####Install

~~~
npm install -g sugarti
~~~

#####Usage

You will need to be in the root folder of your project, where **tiapp.xml** resides.

~~~
Dans-MacBook-Pro:app Dan$ sti

Available commands:

  i5             Run project in iphone 5 simulator - iPhone (Retina 4-inch).
  i4             Run project in iphone 4 simulator - iPhone (Retina 3.5-inch).
  i3             Run project in iphone 3 simulator - iPhone.
  di             Deploy to device without using iTunes :)
  clean          Clean the project and start fresh.

~~~

so 

~~~
sti i5
~~~
should build and run the project in the iPhone5 simulator.

#####Troubleshooting
Sometimes fruitstrap cannot install the app on the device. 

~~~
[ !! ] Unable to install package. (e800002d)
~~~

Usually disconnecting the device and connecting it again, followed by a `sti di` does the trick.

If this doesn't work, clean the project and try again.

#####ToDo

- Add more iOs options (iPad, iOs version )
- Add android 
- Add (maybe) sdk to use.


#####License
MIT

#####Pull requests welcome ;)

