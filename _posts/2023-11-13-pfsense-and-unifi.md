---
layout: post
title: "Initialising a pfSense port to pass VLAN traffic tagged by an external switch"
categories: misc
---

<img src="" width="" height="">

Hi all! After a long and troublesome battle against the gods of networking and the intricacies of pfSense, I have finally developed a process (that I understand, at least) for **initialising an `ETHX` port to pass VLAN traffic that is tagged externally by a switching device** (in my case, a [*USW-PRO 48PoE UniFi managed switch*](https://ubiquitistore.com.au/product/ubiquiti-unifi-48-port-managed-gigabit-layer2-and-layer3-switch-with-auto-sensing-802-3at-poe-and-802-3bt-poe-touch-display-660w-gen2-usw-pro-48-poe-au/)).

In the hope that this can be of use to others out there, I have written up my process for doing so below. But first, here is a contextual network diagram for my setup:

<img src="\assets\images\2023-11-13-pfsense-and-unifi\netdia.png" width="" height="">


## **Steps taken**:


1. Plug in an ethernet cable to an unused port on the pfSense box. In my case, this is **ETH3** (gray cable).
    <img src="\assets\images\2023-11-13-pfsense-and-unifi\eth3.jpg" width="" height="">
2. Login to the pfSense router GUI via the browser (default address is `192.168.0.1`, or `XXX.XXX.XXX.1` depending on how you've setup the management LAN it's on), and navigate to **Interfaces / Switches / Ports**. 

    <img src="\assets\images\2023-11-13-pfsense-and-unifi\image.png" width="50%" height="50%">


3. Check the targeted port ETH3 is **ACTIVE**, and then edit the **Port VID** to be **whatever VLAN tag you want to be applied to passing UNTAGGED traffic by DEFAULT.** For ex, `Port VID = 80` will mean any **untagged passing traffic** gets a VLAN tag of `80`.

    ![Alt text](\assets\images\2023-11-13-pfsense-and-unifi\image0.png)

4. **Interfaces / Switches / VLANs**: Click `+ Add Tag`

    ![Alt text](\assets\images\2023-11-13-pfsense-and-unifi\image-1.png)

5. Add whatever VLAN tag you wish to target (in this case `80`), give it a description, and add the **Members**, AKA <mark style="color:rgb(199, 255, 252)"><span style="color: rgb(0, 0, 0); font-weight: bold; font-style: italic;">the numbered ETH ports on the pfSense that will allow this VLAN through.</span></mark>
    
    **I have added ETH3 as a member**, and told pfSense to expect the traffic passing through to be **untagged** (no 't'). 
    
    This means that said **untagged traffic will be assigned a VLAN tag of 80: ETH3’s Port VID** (as specified in Step 1).

    ![Alt text](\assets\images\2023-11-13-pfsense-and-unifi\image-2.png)

    ![Alt text](\assets\images\2023-11-13-pfsense-and-unifi\image-3.png)
    
    ***ALWAYS ADD 9 & 10 tagged, by default (beyond the scope of this tutorial but will write an article about it soon. or read the docs [here](https://docs.netgate.com/pfsense/en/latest/solutions/xg-7100-1u/switch-overview.html))***
    

    ***Key:*** 
    
    *9t = Port 9, expecting & passing VLAN-tagged traffic ONLY.*
    
    *9 = Port 9, expecting & passing **untagged** traffic ONLY.*
    


6. Interfaces > Assignments > VLANs. Create VLAN 80 on the interface corresponding to ETH3 () or a lagg group it’s part of, if any have been created by default/you. 
Assign that interface & VLAN on the Interface Assignments tab
Enable interface, setup static ipv4 & set range (can be any ip address as long as it doesn’t encroach on existing interface ranges. even 6.6.6.1/24)
Save & setup DHCP server settings, set range/pool, & add a domain name for easy id (displayed when doing ipconfig/ifconfig on connected devices) 
Set an allow all rule in firewall - `Protocol=’Any’`
Go to Services >DNS Resolver & check that **Network Interfaces has “All” selected.** Scroll down and SAVE, then press “Apply Changes” at the top of the page.
7. Connect factory-reset USW switch to the end of the ethernet cable plugged into ETH3, and it SHOULD receive an IP on the IP range you specified for VLAN 80 in step X.
8. If you want to adopt the switch to a remote UniFi controller (i.e. one that is hosted on **another network**), connect a device to the USW switch, make sure it is on the same network as the switch (that is, the one using VLAN 80), and then ssh into the switch with default creds `ubnt/ubnt` 
e.g `ssh ubnt@[ip-of-switch]` & then enter `ubnt` as the password.
9. Issue the command: `set-inform http://ip-of-host:8080/inform` to direct the switch to your unifi cloud controller. **Make sure it is reachable from VLAN 80’s network by adjusting pfSense firewall rules.**
10. In unifi controller, create a VLAN-only UniFi ‘network’ with the same VLAN ID as set in pfSense (i.e., `80`)
Create a port profile w/ the **native network** being set to **whatever VLAN-ONLY network you want all passing traffic tagged as.** 
E.g. setting it to the UniFi network we just created will add the **VLAN 80 to passing traffic**, **BEFORE it hits the pfSense.**
11. Remember from step 1 that we configured ETH3 to also act as a switch & thus will continue to add a VLAN tag of **80** to all UNTAGGED traffic passing through it.
12. To allow a device hooked up to the switch to reach a **different VLAN (VLAN 75, per say)** you MUST remember to **ADD whatever pfsense port the switch is connected to** (ETH3 in our case) to the ‘members’ section of the corresponding **VLAN 75.** If the traffic is arriving pre-tagged by the switch, make sure to add the member as **tagged**.
    
    See below: now BOTH ports **ETH3** & ETH7 are configured to let through traffic tagged with **VLAN 75** ()
    
    ![Alt text](\assets\images\2023-11-13-pfsense-and-unifi\image-4.png)    

13. now you should be able to specify different ports on the USW switch to tag traffic coming through with a particular **VLAN** tag, & have it sent to the corresponding **VLAN** network on the pfsense!