/*
 * Fair Protocol, open source decentralised inference marketplace for artificial intelligence.
 * Copyright (C) 2023 Fair Protocol
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU
 * Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public License
 * along with this program. If not, see http://www.gnu.org/licenses/.
 */

import CONFIG from '../config.json' assert { type: 'json' };

const prompt = `O say can you see, by the dawn's early light,
What so proudly we hail'd at the twilight's last gleaming,
Whose broad stripes and bright stars through the perilous fight
O'er the ramparts we watch'd were so gallantly streaming?
And the rocket's red glare, the bombs bursting in air,
Gave proof through the night that our flag was still there,
O say does that star-spangled banner yet wave
O'er the land of the free and the home of the brave?

On the shore dimly seen through the mists of the deep
Where the foe's haughty host in dread silence reposes,
What is that which the breeze, o'er the towering steep,
As it fitfully blows, half conceals, half discloses?
Now it catches the gleam of the morning's first beam,
In full glory reflected now shines in the stream,
'Tis the star-spangled banner - O long may it wave
O'er the land of the free and the home of the brave!

And where is that band who so vauntingly swore,
That the havoc of war and the battle's confusion
A home and a Country should leave us no more?
Their blood has wash'd out their foul footstep's pollution.
No refuge could save the hireling and slave
From the terror of flight or the gloom of the grave,
And the star-spangled banner in triumph doth wave
O'er the land of the free and the home of the brave.

O thus be it ever when freemen shall stand
Between their lov'd home and the war's desolation!
Blest with vict'ry and peace may the heav'n rescued land
Praise the power that hath made and preserv'd us a nation!
Then conquer we must, when our cause it is just,
And this be our motto - "In God is our trust,
And the star-spangled banner in triumph shall wave
O'er the land of the free and the home of the brave.`;

const inference = async function (text: string) {
  const res = await fetch(`${CONFIG.url}/`, {
    method: 'POST',
    body: text,
  });
  const tempData: string = await res.text();
  console.log(tempData);
  return tempData;
};

(async () => {
  await inference(prompt);
})();
