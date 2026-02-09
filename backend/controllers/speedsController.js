const Speed = require('../models/Speed');

// Submit new pitch speed
const submitSpeed = async (req, res) => {
  try {
    const { playerName, indexNumber, phoneNumber, gender, pitchSpeed, attemptNumber, isTemporary } = req.body;

    // Validation - allow temporary submissions for immediate display
    if (!pitchSpeed || !attemptNumber) {
      return res.status(400).json({ message: 'Speed and attempt number are required' });
    }

    if (attemptNumber < 1 || attemptNumber > 3) {
      return res.status(400).json({ message: 'Attempt number must be 1, 2, or 3' });
    }

    // For temporary attempts (immediate display), use default values
    const finalPlayerName = playerName || `Attempt ${attemptNumber}`;
    const finalIndexNumber = indexNumber || 'TEMP';
    const finalPhoneNumber = phoneNumber || 'TEMP';
    const finalGender = gender || 'male';

    // Handle "--" as special error value
    let finalPitchSpeed;
    if (pitchSpeed === '--') {
      finalPitchSpeed = '--'; // Store as string for error display
    } else {
      finalPitchSpeed = parseFloat(pitchSpeed);
    }

    const newSpeed = new Speed({
      playerName: finalPlayerName,
      indexNumber: finalIndexNumber,
      phoneNumber: finalPhoneNumber,
      gender: finalGender,
      pitchSpeed: finalPitchSpeed,
      attemptNumber: parseInt(attemptNumber),
      isTemporary: isTemporary || false
    });

    await newSpeed.save();
    res.status(201).json(newSpeed);
  } catch (error) {
    console.error('Error submitting speed:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get latest speeds for display - exclude player submissions to avoid duplicates
const getLatestSpeeds = async (req, res) => {
  try {
    const latestSpeeds = await Speed.find({
      $or: [
        { isTemporary: true },
        { indexNumber: 'TEMP' }
      ]
    })
    .sort({ timestamp: -1 })
    .limit(10)
    .select('playerName pitchSpeed gender timestamp');
    
    res.json(latestSpeeds);
  } catch (error) {
    console.error('Error fetching latest speeds:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get leaderboard data
const getLeaderboard = async (req, res) => {
  try {
    // Get best speed for each player (group by indexNumber to handle multiple entries)
    const bestSpeeds = await Speed.aggregate([
      {
        $match: {
          indexNumber: { $ne: 'TEMP' }, // Exclude temporary attempts
          pitchSpeed: { $ne: '--' } // Exclude error entries
        }
      },
      {
        $group: {
          _id: {
            indexNumber: '$indexNumber' // Group by indexNumber to handle same player multiple times
          },
          playerName: { $first: '$playerName' },
          phoneNumber: { $first: '$phoneNumber' },
          gender: { $first: '$gender' },
          bestSpeed: { $max: '$pitchSpeed' },
          timestamp: { $max: '$timestamp' }
        }
      },
      {
        $project: {
          playerName: 1,
          indexNumber: '$_id.indexNumber',
          phoneNumber: 1,
          gender: 1,
          bestSpeed: 1,
          timestamp: 1,
          _id: 0
        }
      },
      {
        $sort: { bestSpeed: -1 }
      }
    ]);

    // Separate by gender and get required positions
    const maleLeaders = bestSpeeds
      .filter(record => record.gender === 'male')
      .slice(0, 3); // Only top 3 for male

    const femaleLeaders = bestSpeeds
      .filter(record => record.gender === 'female')
      .slice(0, 2); // Only top 2 for female

    res.json({
      male: maleLeaders,
      female: femaleLeaders
    });
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Reset leaderboard
const resetLeaderboard = async (req, res) => {
  try {
    await Speed.deleteMany({});
    res.json({ message: 'Leaderboard reset successfully' });
  } catch (error) {
    console.error('Error resetting leaderboard:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Export results as CSV
const exportResults = async (req, res) => {
  try {
    const allSpeeds = await Speed.find({ 
      indexNumber: { $ne: 'TEMP' } // Exclude temporary attempts
    }).sort({ timestamp: -1 });
    
    let csv = 'Player Name,Index Number,Phone Number,Gender,Pitch Speed (km/h),Attempt Number,Timestamp\n';
    
    allSpeeds.forEach(speed => {
      csv += `"${speed.playerName}","${speed.indexNumber}","${speed.phoneNumber}","${speed.gender}",${speed.pitchSpeed},${speed.attemptNumber},"${speed.timestamp}"\n`;
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=fastest-arm-results.csv');
    res.send(csv);
  } catch (error) {
    console.error('Error exporting results:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  submitSpeed,
  getLatestSpeeds,
  getLeaderboard,
  resetLeaderboard,
  exportResults
};