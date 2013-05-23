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

  i5             Run project in iPhone 5 simulator - iPhone (Retina 4-inch).
  i4             Run project in iPhone 4 simulator - iPhone (Retina 3.5-inch).
  i3             Run project in iPhone 3 simulator - iPhone.
  di             Deploy to device without using iTunes :)

  ri             Hot RELOAD the app in simulator - Only the changes in JS files will have effect!
  
  clean          Clean the iOs project and start fresh.
~~~

so 

~~~
sti i5
~~~
should build and run the project in the iPhone5 simulator.

**sti ri** is a very handy command, as it will restart only the application without rebuilding or even restarting the simulator. **However, only the changes** in the javascript files will have effect. If you modify/add assets or settings in tiapp.xml you will have to make a new build (sti with i3,i4 or i5).

#####Troubleshooting
Sometimes fruitstrap cannot install the app on the device. 

~~~
[ !! ] Unable to install package. (e800002d)
~~~

Usually disconnecting the device and connecting it again, followed by a `sti di` does the trick.

If this doesn't work, clean the project and try again.

#####Even more troubleshooting
SugarTi is tested with titanium CLI 3.1.0 only. So please check that you have this version installed.

Also, all the build commands are wrappers around titanium and if SugarTi fails please check that Titnaium CLI works wih direct commands first.



#####ToDo

- Add more iOS options (iPad, iOS version )
- Add Android 
- Add (maybe) SDK to use.


#####License
MIT

#####Pull requests welcome ;)

